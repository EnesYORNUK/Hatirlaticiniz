import React, { useState } from 'react';
import { Check } from '../types';
import { Save, X, CreditCard, Receipt } from 'lucide-react';

interface CheckFormProps {
  onSave: (check: Omit<Check, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Check;
}

export default function CheckForm({ onSave, onCancel, initialData }: CheckFormProps) {
  const [formData, setFormData] = useState({
    createdDate: initialData?.createdDate || new Date().toISOString().split('T')[0],
    paymentDate: initialData?.paymentDate || '',
    amount: initialData?.amount?.toString() || '',
    createdBy: initialData?.createdBy || '',
    signedTo: initialData?.signedTo || '',
    isPaid: initialData?.isPaid || false,
    type: initialData?.type || 'check' as 'check' | 'bill',
    billType: initialData?.billType || 'elektrik' as 'elektrik' | 'su' | 'dogalgaz' | 'telefon' | 'internet' | 'diger',
    customBillType: initialData?.customBillType || '',
    isRecurring: false,
    recurringType: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    recurringDay: 1,
    nextPaymentDate: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Ödeme tarihi zorunludur';
    }

    if (!formData.amount) {
      newErrors.amount = 'Tutar zorunludur';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Geçerli bir tutar giriniz';
      }
    }

    if (!formData.createdBy.trim()) {
      newErrors.createdBy = 'Kim ödeyecek bilgisi zorunludur';
    }

    if (!formData.signedTo.trim()) {
      newErrors.signedTo = 'Kime ödenecek bilgisi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      isRecurring: false,
      recurringType: formData.recurringType,
      recurringDay: formData.recurringDay,
      nextPaymentDate: undefined,
    };

    onSave(checkData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <div className="theme-surface rounded-lg shadow-sm border theme-border">
          
          {/* Clean Header */}
          <div className="theme-primary px-6 py-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              {formData.type === 'check' ? (
                <CreditCard className="w-5 h-5 text-white" />
              ) : (
                <Receipt className="w-5 h-5 text-white" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {initialData ? 'Düzenle' : 'Yeni Ekle'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {formData.type === 'check' ? 'Çek bilgilerini girin' : 'Fatura bilgilerini girin'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Type Selection */}
            <div>
              <label className="theme-text block text-sm font-medium mb-2">
                Ödeme Türü
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'check')}
                  className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                    formData.type === 'check'
                      ? 'theme-primary border-blue-600 text-white'
                      : 'theme-surface theme-border theme-text hover:theme-bg-secondary'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1" />
                  Çek
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('type', 'bill')}
                  className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                    formData.type === 'bill'
                      ? 'theme-primary border-blue-600 text-white'
                      : 'theme-surface theme-border theme-text hover:theme-bg-secondary'
                  }`}
                >
                  <Receipt className="w-4 h-4 mx-auto mb-1" />
                  Fatura
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Ödeme Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleChange('paymentDate', e.target.value)}
                  className={`theme-input w-full ${
                    errors.paymentDate ? 'border-red-500' : ''
                  }`}
                />
                {errors.paymentDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentDate}</p>
                )}
              </div>

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
                  className={`theme-input w-full ${
                    errors.amount ? 'border-red-500' : ''
                  }`}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Kim Ödeyecek *
                </label>
                <input
                  type="text"
                  placeholder="Adınızı girin"
                  value={formData.createdBy}
                  onChange={(e) => handleChange('createdBy', e.target.value)}
                  className={`theme-input w-full ${
                    errors.createdBy ? 'border-red-500' : ''
                  }`}
                />
                {errors.createdBy && (
                  <p className="text-red-500 text-sm mt-1">{errors.createdBy}</p>
                )}
              </div>

              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Kime/Nereye Ödenecek *
                </label>
                <input
                  type="text"
                  placeholder="Firma veya kişi adını girin"
                  value={formData.signedTo}
                  onChange={(e) => handleChange('signedTo', e.target.value)}
                  className={`theme-input w-full ${
                    errors.signedTo ? 'border-red-500' : ''
                  }`}
                />
                {errors.signedTo && (
                  <p className="text-red-500 text-sm mt-1">{errors.signedTo}</p>
                )}
              </div>
            </div>

            {/* Payment Status */}
            <div className="flex items-center gap-3 p-3 theme-bg-secondary rounded-lg">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                onChange={(e) => handleChange('isPaid', e.target.checked)}
                className="theme-checkbox"
              />
              <label htmlFor="isPaid" className="theme-text text-sm font-medium">
                Ödendi olarak işaretle
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t theme-border">
              <button
                type="submit"
                className="theme-button flex-1 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {initialData ? 'Güncelle' : 'Kaydet'}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="theme-button-secondary px-6 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}