import { useState, useEffect, useCallback, useRef } from 'react';
import { User, AuthState, LoginData, RegisterData } from '../types';
import { supabase, initializeSupabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Convert Supabase user to our User type
const convertSupabaseUser = (supabaseUser: SupabaseUser, profile?: Record<string, unknown>): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  fullName: profile?.full_name as string || supabaseUser.user_metadata?.full_name as string || 'Unknown User',
  createdAt: supabaseUser.created_at
});

// Global authentication state manager - TRUE SINGLETON
class AuthManager {
  private static instance: AuthManager | null = null;
  private initialized = false;
  private subscription: any = null;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private currentState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  addListener(callback: (state: AuthState) => void) {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.currentState);
  }

  removeListener(callback: (state: AuthState) => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentState));
  }

  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.notifyListeners();
  }

  async initialize() {
    if (this.initialized) {
      console.log('🔄 Auth manager already initialized');
      return;
    }

    this.initialized = true;
    console.log('🚀 Initializing auth manager...');

    // Set timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('⏰ Auth initialization timeout');
      this.updateState({ isLoading: false });
    }, 5000);

    try {
      // Ensure Supabase client is initialized to avoid race conditions
      await initializeSupabase();
      // Check initial session
      await this.checkSession();
      clearTimeout(timeoutId);

      // Set up auth state listener - ONLY ONCE
      if (supabase && !this.subscription) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth state changed:', event);
            
            // Ignore INITIAL_SESSION completely
            if (event === 'INITIAL_SESSION') {
              console.log('⏭️ Ignoring INITIAL_SESSION event');
              return;
            }
            
            if (event === 'SIGNED_IN') {
              console.log('✅ User signed in');
              await this.handleSignIn(session);
            } else if (event === 'SIGNED_OUT') {
              console.log('👋 User signed out');
              this.updateState({
                user: null,
                isAuthenticated: false,
                isLoading: false
              });
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('🔄 Token refreshed');
              // Session should still be valid, no action needed
            }
          }
        );

        this.subscription = subscription;
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      this.updateState({ isLoading: false });
      clearTimeout(timeoutId);
    }
  }

  private async checkSession() {
    if (!supabase) {
      console.log('⚠️ Supabase not initialized');
      this.updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      return;
    }

    try {
      console.log('🔍 Checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        const msg = (error as any)?.message || String(error);
        if (msg.includes('Invalid Refresh Token')) {
          try {
            await supabase.auth.signOut();
            console.log('🧹 Cleared invalid session tokens');
          } catch (signOutErr) {
            console.warn('⚠️ Failed to sign out while clearing invalid session', signOutErr);
          }
        }
        this.updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        return;
      }

      if (session?.user) {
        console.log('👤 User session found:', session.user.id);
        await this.handleSignIn(session);
      } else {
        console.log('👤 No user session found');
        this.updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('❌ Session check error:', error);
      this.updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }

  private async handleSignIn(session: any) {
    if (!session?.user || !supabase) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      const user = convertSupabaseUser(session.user, profile || undefined);
      console.log('✅ User authenticated:', user);
      this.updateState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      console.error('❌ Error getting profile:', error);
      const user = convertSupabaseUser(session.user);
      this.updateState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
    }
  }

  async login({ email, password }: LoginData) {
    try {
      // Login başlarken yükleme durumunu aç
      this.updateState({ isLoading: true });
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      // Güvenli geçiş için oturumu tekrar kontrol et
      await this.checkSession();
      
      return { user: data.user, error: null };
    } catch (error: unknown) {
      console.error('❌ Login error:', error);
      // Hata durumunda yüklemeyi kapat
      this.updateState({ isLoading: false });
      return { user: null, error: error as Error };
    }
  }

  async register({ email, password, fullName }: RegisterData) {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) throw error;
      
      // Create profile in database
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              created_at: new Date().toISOString()
            }
          ]);
        
        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
        }
      }
      
      return { user: data.user, error: null };
    } catch (error: unknown) {
      console.error('❌ Registration error:', error);
      return { user: null, error: error as Error };
    }
  }

  async logout() {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Ensure UI updates immediately without relying solely on onAuthStateChange
      this.updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      return { error: null };
    } catch (error: unknown) {
      console.error('❌ Logout error:', error);
      return { error: error as Error };
    }
  }

  async refreshSession() {
    await this.checkSession();
  }

  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

// Get the singleton instance
const authManager = AuthManager.getInstance();

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    // Create a stable callback that checks if component is still mounted
    const handleStateChange = (state: AuthState) => {
      if (mountedRef.current) {
        setAuthState(state);
      }
    };

    // Add listener to auth manager
    authManager.addListener(handleStateChange);

    // Initialize auth manager (will only happen once globally)
    authManager.initialize();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      authManager.removeListener(handleStateChange);
    };
  }, []); // Empty dependency array - effect runs only once

  // Wrap auth manager methods with useCallback for stability
  const login = useCallback((data: LoginData) => authManager.login(data), []);
  const register = useCallback((data: RegisterData) => authManager.register(data), []);
  const logout = useCallback(() => authManager.logout(), []);
  const refreshSession = useCallback(() => authManager.refreshSession(), []);

  return {
    ...authState,
    login,
    register,
    logout,
    refreshSession
  };
};