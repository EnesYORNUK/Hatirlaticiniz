import React, { useState } from 'react';
import { Check } from '../types';
import { Save, X, CreditCard, Receipt } from 'lucide-react';

interface CheckFormProps {
  onSave: (check: Omit<Check, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Check; // Edit modunda kullanılacak başlangıç verisi
}

export default function CheckForm({ onSave, onCancel, initialData }: CheckFormProps) {
  const [formData, setFormData] = useState({
    createdDate: initialData?.createdDate || new Date().toISOString().split('T')[0],
    paymentDate: initialData?.paymentDate || '',
    amount: initialData?.amount?.toString() || '',
    createdBy: initialData?.createdBy || '',
    signedTo: initialData?.signedTo || '',
    isPaid: initialData?.isPaid || false,
    // Yeni alanlar
    type: initialData?.type || 'check' as 'check' | 'bill',
    billType: initialData?.billType || 'elektrik' as 'elektrik' | 'su' | 'dogalgaz' | 'telefon' | 'internet' | 'diger',
    customBillType: initialData?.customBillType || '',
    isRecurring: initialData?.isRecurring || false,
    recurringType: initialData?.recurringType || 'monthly' as 'monthly' | 'weekly' | 'yearly',
    recurringDay: initialData?.recurringDay || 1,
    nextPaymentDate: initialData?.nextPaymentDate || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Payment date validation
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Ödeme tarihi zorunludur';
    } else {
      // Date format validation
      const paymentDate = new Date(formData.paymentDate);
      const today = new Date();
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() + 10); // Max 10 yıl ilerisi
      
      if (isNaN(paymentDate.getTime())) {
        newErrors.paymentDate = 'Geçerli bir tarih giriniz';
      } else if (paymentDate > maxDate) {
        newErrors.paymentDate = 'Ödeme tarihi çok uzak gelecekte olamaz';
      }
    }

    // Amount validation - enhanced
    if (!formData.amount) {
      newErrors.amount = 'Tutar zorunludur';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) {
        newErrors.amount = 'Geçerli bir sayı giriniz';
      } else if (amount <= 0) {
        newErrors.amount = 'Tutar sıfırdan büyük olmalıdır';
      } else if (amount > 999999999) {
        newErrors.amount = 'Tutar çok yüksek (Max: 999.999.999 TL)';
      } else if (amount < 0.01) {
        newErrors.amount = 'Minimum tutar 0.01 TL olmalıdır';
      }
    }

    // Name validation - enhanced
    if (!formData.createdBy.trim()) {
      newErrors.createdBy = 'Oluşturan kişi zorunludur';
    } else if (formData.createdBy.trim().length < 2) {
      newErrors.createdBy = 'İsim en az 2 karakter olmalıdır';
    } else if (formData.createdBy.trim().length > 50) {
      newErrors.createdBy = 'İsim en fazla 50 karakter olabilir';
    }

    // Company/Person validation - enhanced
    if (!formData.signedTo.trim()) {
      newErrors.signedTo = 'Ödenecek Firma/Kişi zorunludur';
    } else if (formData.signedTo.trim().length < 2) {
      newErrors.signedTo = 'Firma/Kişi adı en az 2 karakter olmalıdır';
    } else if (formData.signedTo.trim().length > 100) {
      newErrors.signedTo = 'Firma/Kişi adı en fazla 100 karakter olabilir';
    }

    // Custom bill type validation
    if (formData.type === 'bill' && formData.billType === 'diger') {
      if (!formData.customBillType.trim()) {
        newErrors.customBillType = 'Fatura türü belirtiniz';
      } else if (formData.customBillType.trim().length < 2) {
        newErrors.customBillType = 'Fatura türü en az 2 karakter olmalıdır';
      } else if (formData.customBillType.trim().length > 30) {
        newErrors.customBillType = 'Fatura türü en fazla 30 karakter olabilir';
      }
    }

    // Recurring validation - enhanced
    if (formData.isRecurring) {
      if (!formData.recurringDay || formData.recurringDay < 1) {
        newErrors.recurringDay = 'Geçerli bir gün giriniz';
      } else {
        // Month-specific validation
        if (formData.recurringType === 'monthly' && formData.recurringDay > 31) {
          newErrors.recurringDay = 'Ayın günü 1-31 arasında olmalıdır';
        } else if (formData.recurringType === 'weekly' && formData.recurringDay > 7) {
          newErrors.recurringDay = 'Haftanın günü 1-7 arasında olmalıdır';
        } else if (formData.recurringType === 'yearly' && formData.recurringDay > 365) {
          newErrors.recurringDay = 'Yılın günü 1-365 arasında olmalıdır';
        }
      }
    }

    // Created date validation
    if (formData.createdDate) {
      const createdDate = new Date(formData.createdDate);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 5); // Max 5 yıl geçmiş
      
      if (isNaN(createdDate.getTime())) {
        newErrors.createdDate = 'Geçerli bir tarih giriniz';
      } else if (createdDate > today) {
        newErrors.createdDate = 'Oluşturulma tarihi gelecekte olamaz';
      } else if (createdDate < minDate) {
        newErrors.createdDate = 'Oluşturulma tarihi çok eski olamaz';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateNextPaymentDate = () => {
    if (!formData.isRecurring || !formData.paymentDate) return '';
    
    const baseDate = new Date(formData.paymentDate);
    const nextDate = new Date(baseDate);
    
    switch (formData.recurringType) {
      case 'weekly':
        nextDate.setDate(baseDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(baseDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(baseDate.getFullYear() + 1);
        break;
    }
    
    return nextDate.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const checkData: Omit<Check, 'id' | 'createdAt'> = {
      createdDate: formData.createdDate,
      paymentDate: formData.paymentDate,
      amount: parseFloat(formData.amount),
      createdBy: formData.createdBy.trim(),
      signedTo: formData.signedTo.trim(),
      isPaid: formData.isPaid,
      type: formData.type,
      billType: formData.billType,
      customBillType: formData.customBillType.trim(),
      isRecurring: formData.isRecurring,
      recurringType: formData.recurringType,
      recurringDay: formData.recurringDay,
      nextPaymentDate: formData.isRecurring ? generateNextPaymentDate() : undefined,
    };

    onSave(checkData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // PaymentDate değiştiğinde ve recurring aktifse, recurringDay'i otomatik set et
      if (field === 'paymentDate' && updated.isRecurring && value) {
        const date = new Date(value);
        updated.recurringDay = date.getDate();
      }
      
      // isRecurring aktif edildiğinde ve paymentDate varsa, recurringDay'i set et
      if (field === 'isRecurring' && value && updated.paymentDate) {
        const date = new Date(updated.paymentDate);
        updated.recurringDay = date.getDate();
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="theme-bg min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="theme-surface rounded-xl shadow-lg border theme-border overflow-hidden">
          {/* Header */}
          <div className="theme-primary px-6 py-4">
            <div className="flex items-center gap-3">
              {formData.type === 'check' ? (
                <CreditCard className="w-6 h-6 text-white" />
              ) : (
                <Receipt className="w-6 h-6 text-white" />
              )}
              <h2 className="text-xl font-bold text-white">
                {initialData ? 'Düzenle' : 'Yeni'} {formData.type === 'check' ? 'Çek' : 'Fatura'}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Tip Seçimi */}
            <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
              <label className="theme-text block text-sm font-medium mb-3">
                Ödeme Türü *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'check')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'check'
                      ? 'theme-primary border-current text-white'
                      : 'theme-surface theme-border theme-text hover:theme-bg-secondary'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Çek</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('type', 'bill')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'bill'
                      ? 'theme-primary border-current text-white'
                      : 'theme-surface theme-border theme-text hover:theme-bg-secondary'
                  }`}
                >
                  <Receipt className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Fatura</span>
                </button>
              </div>
            </div>

            {/* Fatura Türü (sadece bill seçiliyse) */}
            {formData.type === 'bill' && (
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Fatura Türü *
                </label>
                <select
                  value={formData.billType}
                  onChange={(e) => handleChange('billType', e.target.value)}
                  className="theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="elektrik">⚡ Elektrik</option>
                  <option value="su">💧 Su</option>
                  <option value="dogalgaz">🔥 Doğalgaz</option>
                  <option value="telefon">📞 Telefon</option>
                  <option value="internet">🌐 İnternet</option>
                  <option value="diger">📄 Diğer</option>
                </select>
                {formData.billType === 'diger' && (
                  <input
                    type="text"
                    placeholder="Fatura türünü belirtin..."
                    value={formData.customBillType}
                    onChange={(e) => handleChange('customBillType', e.target.value)}
                    className={`theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-2 ${
                      errors.customBillType ? 'border-red-500' : ''
                    }`}
                  />
                )}
                {errors.customBillType && (
                  <p className="text-red-500 text-sm mt-1">{errors.customBillType}</p>
                )}
              </div>
            )}

            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Oluşturulma Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.createdDate}
                  onChange={(e) => handleChange('createdDate', e.target.value)}
                  className="theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Ödeme Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleChange('paymentDate', e.target.value)}
                  className={`theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.paymentDate ? 'border-red-500' : ''
                  }`}
                />
                {errors.paymentDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentDate}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Tutar (TL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className={`theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-500' : ''
                  }`}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Oluşturan Kişi *
                </label>
                <input
                  type="text"
                  placeholder="Adınızı girin"
                  value={formData.createdBy}
                  onChange={(e) => handleChange('createdBy', e.target.value)}
                  className={`theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.createdBy ? 'border-red-500' : ''
                  }`}
                />
                {errors.createdBy && (
                  <p className="text-red-500 text-sm mt-1">{errors.createdBy}</p>
                )}
              </div>
            </div>

            <div>
              <label className="theme-text block text-sm font-medium mb-2">
                Ödenecek Firma/Kişi *
              </label>
              <input
                type="text"
                placeholder="Firma veya kişi adını girin"
                value={formData.signedTo}
                onChange={(e) => handleChange('signedTo', e.target.value)}
                className={`theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.signedTo ? 'border-red-500' : ''
                }`}
              />
              {errors.signedTo && (
                <p className="text-red-500 text-sm mt-1">{errors.signedTo}</p>
              )}
            </div>

            {/* Tekrarlayan Ödeme */}
            <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => handleChange('isRecurring', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isRecurring" className="theme-text text-sm font-medium">
                  🔄 Tekrarlayan Ödeme
                </label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="theme-text block text-sm font-medium mb-2">
                        Tekrar Türü
                      </label>
                      <select
                        value={formData.recurringType}
                        onChange={(e) => handleChange('recurringType', e.target.value)}
                        className="theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="weekly">📅 Haftalık</option>
                        <option value="monthly">📆 Aylık</option>
                        <option value="yearly">🗓️ Yıllık</option>
                      </select>
                    </div>

                    <div>
                      <label className="theme-text block text-sm font-medium mb-2">
                        {formData.recurringType === 'weekly' ? 'Haftanın Günü' : 
                         formData.recurringType === 'monthly' ? 'Ayın Günü' : 'Yılın Günü'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={formData.recurringType === 'monthly' ? "31" : formData.recurringType === 'weekly' ? "7" : "365"}
                        value={formData.recurringDay}
                        onChange={(e) => handleChange('recurringDay', parseInt(e.target.value))}
                        className={`theme-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.recurringDay ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.recurringDay && (
                        <p className="text-red-500 text-sm mt-1">{errors.recurringDay}</p>
                      )}
                    </div>
                  </div>

                  <div className="theme-info bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      💡 Bu ödeme her {formData.recurringType === 'weekly' ? 'hafta' : 
                                       formData.recurringType === 'monthly' ? 'ay' : 'yıl'} tekrarlanacak.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Ödeme Durumu */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                onChange={(e) => handleChange('isPaid', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="isPaid" className="theme-text text-sm font-medium">
                ✅ Ödendi olarak işaretle
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t theme-border">
              <button
                type="submit"
                className="theme-button flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {initialData ? 'Güncelle' : 'Kaydet'}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="theme-button-secondary px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}