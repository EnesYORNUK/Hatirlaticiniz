import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { RegisterData } from '../types';

interface RegisterProps {
  onRegister: (data: RegisterData) => Promise<void> | void;
  onSwitchToLogin: () => void;
  error: string | null;
  isLoading: boolean;
}

export const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin, error, isLoading }) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<RegisterData> = {};

    // Ad Soyad kontrolü
    if (!formData.fullName.trim()) {
      errors.fullName = 'Ad Soyad gerekli';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Ad Soyad en az 2 karakter olmalı';
    }

    // E-posta kontrolü
    if (!formData.email.trim()) {
      errors.email = 'E-posta adresi gerekli';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi girin';
    }

    // Şifre kontrolü
    if (!formData.password.trim()) {
      errors.password = 'Şifre gerekli';
    } else if (formData.password.length < 6) {
      errors.password = 'Şifre en az 6 karakter olmalı';
    }

    // Şifre tekrarı kontrolü
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Şifre tekrarı gerekli';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onRegister(formData));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center theme-bg px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo ve başlık */}
        <div className="text-center mb-8">
          <div className="theme-primary rounded-2xl p-4 w-16 h-16 mx-auto mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white mx-auto" />
          </div>
          <h1 className="text-2xl font-bold theme-text mb-2">Hesap Oluşturun</h1>
          <p className="theme-text-muted text-sm">Hatırlatıcınız'a kayıt olun</p>
        </div>

        {/* Kayıt formu */}
        <div className="theme-surface rounded-2xl shadow-XL border theme-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Genel hata mesajı */}
            {error && (
              <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            {/* Ad Soyad alanı */}
            <div className="space-y-2">
              <label className="theme-text text-sm font-semibold block">
                Ad Soyad
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <User className="h-5 w-5 theme-text-muted" />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Ad Soyad"
                  disabled={isSubmitting}
                  className="flex-1 theme-input"
                  required
                />
              </div>
              {validationErrors.fullName && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.fullName}</p>
              )}
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
                  placeholder="ornek@eposta.com"
                  disabled={isSubmitting}
                  className="flex-1 theme-input"
                  required
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
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
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="w-full theme-input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
              )}
            </div>
            {/* Şifre tekrarı alanı */}
            <div className="space-y-2">
              <label className="theme-text text-sm font-semibold block">
                Şifre Tekrarı
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Lock className="h-5 w-5 theme-text-muted" />
                </div>
                <div className="relative flex-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="w-full theme-input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>
            {/* Kayıt ol butonu */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full theme-primary text-white rounded-xl py-3 font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Kayıt olunuyor...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Kayıt Ol</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Giriş yap linki */}
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
              onClick={onSwitchToLogin}
              disabled={isSubmitting}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              Zaten hesabınız var mı? <span className="underline">Giriş yapın</span>
            </button>
          </div>
        </div>

        {/* Alt bilgi */}
        <div className="text-center mt-6">
          <p className="theme-text-muted text-xs">
            Kayıt olarak <span className="text-blue-600">Kullanım Şartları</span> ve <span className="text-blue-600">Gizlilik Politikası</span>nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;