import { useState, useEffect, useCallback } from 'react';
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

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Check authentication state on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        await initializeSupabase();
        console.log('🔍 Checking auth state...');
        
        // If Supabase is not initialized, skip auth check
        if (!supabase) {
          console.log('⚠️ Supabase not initialized, skipping auth check');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }
        
        // Get session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }

        console.log('✅ Session check completed:', session?.user?.id || 'No session');

        if (session?.user) {
          console.log('👤 User session found, getting profile...');
          // Get user profile from database
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('❌ Error getting profile:', profileError);
            }

            const user = convertSupabaseUser(session.user, profile || undefined);
            console.log('✅ User authenticated:', user);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false
            });
          } catch (profileError: unknown) {
            console.error('❌ Error in profile fetch:', profileError);
            // Still authenticate with just the session user
            const user = convertSupabaseUser(session.user);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false
            });
          }
        } else {
          console.log('👤 No user session found');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } catch (error: unknown) {
        console.error('❌ Auth check error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    // Set a backup timeout to ensure loading never hangs
    const timeoutId = setTimeout(() => {
      console.log('⏰ Auth check timeout - forcing loaded state');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }, 3000); // 3 second backup timeout

    checkAuthState().finally(() => {
      clearTimeout(timeoutId);
    });

    // Set up auth state change listener
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state changed:', event, session?.user?.id);
          
          if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            return;
          }
          
          if (session?.user) {
            try {
              if (supabase) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                const user = convertSupabaseUser(session.user, profile || undefined);
                console.log('✅ User authenticated via state change:', user);
                setAuthState({
                  user,
                  isAuthenticated: true,
                  isLoading: false
                });
              } else {
                // Fallback when supabase is not available
                const user = convertSupabaseUser(session.user);
                setAuthState({
                  user,
                  isAuthenticated: true,
                  isLoading: false
                });
              }
            } catch (error: unknown) {
              console.error('❌ Error getting profile on auth change:', error);
              // Still authenticate with just the session user
              const user = convertSupabaseUser(session.user);
              setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false
              });
            }
          }
        }
      );

      return () => {
        subscription?.unsubscribe();
        clearTimeout(timeoutId);
      };
    } else {
      // If no supabase, immediately set to not loading
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      clearTimeout(timeoutId);
    }
  }, []);

  // Login with email and password
  const login = useCallback(async ({ email, password }: LoginData) => {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error: unknown) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);

  // Register with email and password
  const register = useCallback(async ({ email, password, fullName }: RegisterData) => {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Create the user
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
      
      // Create profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            email
          } as any);
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
      
      return { success: true, data };
    } catch (error: unknown) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error: unknown) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);

  return {
    ...authState,
    login,
    register,
    logout
  };
};