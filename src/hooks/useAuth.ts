import { useState, useEffect } from 'react';
import { User, AuthState, LoginData, RegisterData } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Convert Supabase user to our User type
const convertSupabaseUser = (supabaseUser: SupabaseUser, profile?: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  fullName: profile?.full_name || supabaseUser.user_metadata?.full_name || 'Unknown User',
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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }

        if (session?.user) {
          // Get user profile from database
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error getting profile:', profileError);
          }

          const user = convertSupabaseUser(session.user, profile);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    checkAuthState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (session?.user) {
        // Get user profile from database
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error getting profile:', profileError);
          }

          const user = convertSupabaseUser(session.user, profile);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (profileError) {
          console.error('Error getting profile:', profileError);
          const user = convertSupabaseUser(session.user);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (loginData: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        // Daha açıklayıcı hata mesajları
        if (error.message.includes('failed to fetch')) {
          return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
        }
        return { success: false, error: error.message };
      }

      // Authentication successful - state will be updated by onAuthStateChange
      return { success: true };
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      // Daha açıklayıcı hata mesajları
      if (error?.message?.includes('failed to fetch')) {
        return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
      }
      return { success: false, error: error.message || 'Giriş sırasında bir hata oluştu!' };
    }
  };

  // Register function
  const register = async (registerData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Validate passwords match
      if (registerData.password !== registerData.confirmPassword) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Şifreler eşleşmiyor!' };
      }

      if (registerData.password.length < 6) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Şifre en az 6 karakter olmalı!' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
          },
        },
      });

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        // Daha açıklayıcı hata mesajları
        if (error.message.includes('failed to fetch')) {
          return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
        }
        return { success: false, error: error.message };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { 
          success: false, 
          error: 'Lütfen e-posta adresinizi kontrol edin ve doğrulama linkine tıklayın.' 
        };
      }

      // Registration successful - state will be updated by onAuthStateChange
      return { success: true };
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      // Daha açıklayıcı hata mesajları
      if (error?.message?.includes('failed to fetch')) {
        return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
      }
      return { success: false, error: error.message || 'Kayıt sırasında bir hata oluştu!' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      // State will be updated by onAuthStateChange
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return {
    ...authState,
    login,
    register,
    logout
  };
};