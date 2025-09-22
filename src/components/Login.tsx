import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { LoginData } from '../types';

interface LoginProps {
  onLogin: (data: LoginData) => Promise<void> | void;
  onSwitchToRegister: () => void;
  isLoading: boolean;
  error?: string;
  isAuthAvailable?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister, isLoading, error, isAuthAvailable = true }) => {
  const [formData, setFormData] = useState<LoginData>({
    email: 'demo@hatirlaticiniz.com', // Demo için pre-fill
    password: 'demo123' // Demo için pre-fill
  });
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const errors: Partial<LoginData> = {};

    if (!formData.email.trim()) {
      errors.email = 'E-posta adresi gerekli';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!formData.password.trim()) {
      errors.password = 'Şifre gerekli';
    } else if (formData.password.length < 6) {
      errors.password = 'Şifre en az 6 karakter olmalı';
    }

    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onLogin(formData);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center theme-bg px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo ve başlık */}
        <div className="text-center mb-8">
          <div className="theme-primary rounded-2xl p-4 w-16 h-16 mx-auto mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-white mx-auto" />
          </div>
          <h1 className="text-2xl font-bold theme-text mb-2">Hoş Geldiniz</h1>
          <p className="theme-text-muted text-sm">Hatırlatıcınız'a giriş yapın</p>
        </div>

        {/* Giriş formu */}
        <div className="theme-surface rounded-2xl shadow-xl border theme-border p-8">
          {isAuthAvailable ? null : (
            <div className="flex items-center gap-3 text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                Kimlik doğrulama servisi yapılandırılmamış. Lütfen uygulamayı güncelleyip tekrar deneyin.
              </span>
            </div>
          )}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Genel hata mesajı */}
            {error && (
              <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            {/* E-posta alanı */}
            <div className="space-y-2">
              <label className="theme-text text-sm font-semibold block">
                E-posta Adresi
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Mail className="h-5 w-5 theme-text-muted" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@eposta.com"
                  disabled={isLoading || !isAuthAvailable}
                  className="flex-1 theme-input"
                  required
                />
              </div>
              {/* Basit doğrulama */}
              {!formData.email.includes('@') && formData.email.length > 0 && (
                <p className="text-red-500 text-xs mt-1">Lütfen geçerli bir e-posta adresi girin</p>
              )}
            </div>
            {/* Şifre alanı */}
            <div className="space-y-2">
              <label className="theme-text text-sm font-semibold block">
                Şifre
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Lock className="h-5 w-5 theme-text-muted" />
                </div>
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={isLoading || !isAuthAvailable}
                    className="w-full theme-input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isLoading || !isAuthAvailable}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            {/* Giriş yap butonu */}
            <button
              type="submit"
              disabled={isLoading || !isAuthAvailable}
              className="w-full theme-primary text-white rounded-xl py-3 font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Giriş yapılıyor...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  <span>Giriş Yap</span>
                </div>
              )}
            </button>
            {/* Kayıt ol linki */}
            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t theme-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="theme-surface px-4 theme-text-muted">veya</span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={onSwitchToRegister}
                  disabled={isLoading || !isAuthAvailable}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  Henüz hesabınız yok mu? <span className="underline">Kayıt olun</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Alt bilgi */}
        <div className="text-center mt-6">
          <p className="theme-text-muted text-xs">
            Giriş yaparak <span className="text-blue-600">Kullanım Şartları</span> ve{' '}
            <span className="text-blue-600">Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;