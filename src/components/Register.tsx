import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { RegisterData } from '../types';

interface RegisterProps {
  onRegister: (data: RegisterData) => void;
  onSwitchToLogin: () => void;
  isLoading: boolean;
  error?: string;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin, isLoading, error }) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterData>>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onRegister(formData);
    }
  };

  // Şifre güçlülük kontrolü
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 6) return { strength: 1, text: 'Zayıf', color: 'text-red-500' };
    if (password.length < 8) return { strength: 2, text: 'Orta', color: 'text-yellow-500' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 3, text: 'Güçlü', color: 'text-green-500' };
    }
    return { strength: 2, text: 'Orta', color: 'text-yellow-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
        <div className="theme-surface rounded-2xl shadow-xl border theme-border p-8">
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
                  className={`theme-input w-full px-4 py-3 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.fullName ? 'border-red-500 bg-red-50' : ''
                  }`}
                  placeholder="Adınız ve soyadınız"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.fullName && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.fullName}
                </p>
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
                    placeholder="Güçlü bir şifre oluşturun"
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
              
              {/* Şifre güçlülük göstergesi */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.strength
                              ? passwordStrength.strength === 1
                                ? 'bg-red-500'
                                : passwordStrength.strength === 2
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
              
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.password}
                </p>
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
                    className={`theme-input w-full px-4 pr-12 py-3 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.confirmPassword ? 'border-red-500 bg-red-50' : 
                      formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500 bg-green-50' : ''
                    }`}
                    placeholder="Şifrenizi tekrar girin"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {/* Şifre eşleşme göstergesi */}
              {formData.confirmPassword && (
                <div className="flex items-center gap-1 mt-1">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-green-500 text-xs">Şifreler eşleşiyor</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-red-500 text-xs">Şifreler eşleşmiyor</span>
                    </>
                  )}
                </div>
              )}
              
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Kayıt ol butonu */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full theme-primary hover:opacity-90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Hesap oluşturuluyor...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Hesap Oluştur</span>
                </div>
              )}
            </button>
          </form>

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
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                Zaten hesabınız var mı? <span className="underline">Giriş yapın</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alt bilgi */}
        <div className="text-center mt-6">
          <p className="theme-text-muted text-xs">
            Kayıt olarak <span className="text-blue-600">Kullanım Şartları</span> ve{' '}
            <span className="text-blue-600">Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;