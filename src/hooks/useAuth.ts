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
    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('⏰ Auth check timeout - setting app to loaded state');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }, 5000); // 5 second timeout

    const checkAuthState = async () => {
      try {
        console.log('🔍 Checking auth state...');
        
        // Clear the timeout since we're proceeding
        clearTimeout(timeoutId);
        
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
        
        // Add timeout to the Supabase call
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
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
          // Get user profile from database with timeout
          try {
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const profileTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );
            
            const { data: profile, error: profileError } = await Promise.race([profilePromise, profileTimeoutPromise]) as any;

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
          } catch (profileError) {
            console.error('💥 Error getting profile (timeout or other):', profileError);
            // Still authenticate the user even if profile fetch fails
            const user = convertSupabaseUser(session.user);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false
            });
          }
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
        // Clear timeout on error
        clearTimeout(timeoutId);
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
            let profileData = null;
            let profileError = null;
            
            // Only attempt to get profile if supabase is available
            if (supabase) {
              const result = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              profileData = result.data;
              profileError = result.error;
            }

            if (profileError) {
              console.error('❌ Error getting profile:', profileError);
            }

            const user = convertSupabaseUser(session.user, profileData);
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
      clearTimeout(timeoutId);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return () => {};
    }
  }, []);

  // Login function
  const login = async (loginData: LoginData): Promise<{ success: boolean; error?: string }> => {
    // If Supabase is not available, return error
    if (!supabase) {
      return { success: false, error: 'Kimlik doğrulama servisi kullanılamıyor' };
    }
    
    try {
      console.log('🔐 Attempting login...');
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email.trim(),
        password: loginData.password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        
        // Daha açıklayıcı hata mesajları
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'E-posta veya şifre hatalı!' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Lütfen e-posta adresinizi doğrulayın!' };
        }
        if (error.message.includes('fetch')) {
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
      
      if (error?.message?.includes('fetch') || error?.name === 'TypeError') {
        return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
      }
      return { success: false, error: error.message || 'Giriş sırasında bir hata oluştu!' };
    }
  };

  // Register function
  const register = async (registerData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    // If Supabase is not available, return error
    if (!supabase) {
      return { success: false, error: 'Kimlik doğrulama servisi kullanılamıyor' };
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
        email: registerData.email.trim(),
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName.trim(),
          },
        },
      });

      if (error) {
        console.error('❌ Registration error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        
        // Daha açıklayıcı hata mesajları
        if (error.message.includes('User already registered')) {
          return { success: false, error: 'Bu e-posta adresi zaten kayıtlı!' };
        }
        if (error.message.includes('fetch')) {
          return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
        }
        return { success: false, error: error.message };
      }

      console.log('✅ Registration successful');
      // Check if email confirmation is required
      if (data.user && !data.session) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { 
          success: true, 
          error: 'Kayıt başarılı! Giriş yapabilirsiniz.' 
        };
      }

      // Registration successful - state will be updated by onAuthStateChange
      return { success: true };
    } catch (error: any) {
      console.error('💥 Registration exception:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      // Handle timeout specifically
      if (error?.message === 'Registration request timeout') {
        return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
      }
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
      
      // Add timeout to logout request
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout request timeout')), 5000)
      );
      
      const { error } = await Promise.race([logoutPromise, timeoutPromise]) as any;
      
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