import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { LoginData } from '../types';

interface LoginProps {
  onLogin: (data: LoginData) => void;
  onSwitchToRegister: () => void;
  isLoading: boolean;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister, isLoading, error }) => {
  const [formData, setFormData] = useState<LoginData>({
    email: 'demo@hatirlaticiniz.com', // Demo için pre-fill
    password: 'demo123' // Demo için pre-fill
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<LoginData>>({});

  const handleChange = (field: keyof LoginData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Genel hata mesajı */}
            {error && (
              <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Demo bilgisi */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-blue-800 text-sm">
                <strong>Demo Bilgileri:</strong><br />
                E-posta: demo@hatirlaticiniz.com<br />
                Şifre: demo123
              </div>
            </div>

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
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`theme-input w-full px-4 py-3 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.email ? 'border-red-500 bg-red-50' : ''
                  }`}
                  placeholder="ornek@email.com"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.email}
                </p>
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
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`theme-input w-full px-4 pr-12 py-3 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.password ? 'border-red-500 bg-red-50' : ''
                    }`}
                    placeholder="Şifrenizi girin"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Giriş butonu */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full theme-primary hover:opacity-90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
          </form>

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
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                Henüz hesabınız yok mu? <span className="underline">Kayıt olun</span>
              </button>
            </div>
          </div>
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