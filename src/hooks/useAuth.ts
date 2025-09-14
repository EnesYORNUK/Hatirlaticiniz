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
        
        setAuthState(prev => ({ ...prev, isLoading: true }));
        
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

        console.log('✅ Session check completed:', session);

        if (session?.user) {
          console.log('👤 User session found, getting profile...');
          // Get user profile from database
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('❌ Error getting profile:', profileError);
          }

          const user = convertSupabaseUser(session.user, profile);
          console.log('✅ User authenticated:', user);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          console.log('🚫 No user session found');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('💥 Error checking auth state:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    checkAuthState();

    // Only set up auth state listener if Supabase is available
    if (supabase) {
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session);
        
        if (session?.user) {
          console.log('👤 Session changed, getting profile...');
          // Get user profile from database
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('❌ Error getting profile:', profileError);
            }

            const user = convertSupabaseUser(session.user, profile);
            console.log('✅ User authenticated via state change:', user);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false
            });
          } catch (profileError) {
            console.error('💥 Error getting profile:', profileError);
            const user = convertSupabaseUser(session.user);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false
            });
          }
        } else {
          console.log('🚫 No session in state change');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      });

      return () => {
        console.log('🧹 Cleaning up auth subscription');
        subscription.unsubscribe();
      };
    } else {
      // If Supabase is not available, set loading to false
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return () => {};
    }
  }, []);

  // Login function
  const login = async (loginData: LoginData): Promise<{ success: boolean; error?: string }> => {
    // If Supabase is not available, return error
    if (!supabase) {
      return { success: false, error: 'Authentication service is not available' };
    }
    
    try {
      console.log('🔐 Attempting login...');
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        // Daha açıklayıcı hata mesajları
        if (error.message.includes('failed to fetch')) {
          return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
        }
        return { success: false, error: error.message };
      }

      console.log('✅ Login successful');
      // Authentication successful - state will be updated by onAuthStateChange
      return { success: true };
    } catch (error: any) {
      console.error('💥 Login exception:', error);
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
    // If Supabase is not available, return error
    if (!supabase) {
      return { success: false, error: 'Authentication service is not available' };
    }
    
    try {
      console.log('📝 Attempting registration...');
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
        console.error('❌ Registration error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        // Daha açıklayıcı hata mesajları
        if (error.message.includes('failed to fetch')) {
          return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
        }
        return { success: false, error: error.message };
      }

      console.log('✅ Registration successful');
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
      console.error('💥 Registration exception:', error);
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
    // If Supabase is not available, just update state
    if (!supabase) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      return;
    }
    
    try {
      console.log('🚪 Attempting logout...');
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
      }
      console.log('✅ Logout successful');
      // State will be updated by onAuthStateChange
    } catch (error) {
      console.error('💥 Error during logout:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    ...authState,
    login,
    register,
    logout
  };
};