import React, { useState } from 'react';
import { Check } from '../types';
import { Save, X, CreditCard, Receipt, Calendar, Repeat } from 'lucide-react';

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
    isRecurring: initialData?.isRecurring || false,
    recurringType: initialData?.recurringType || 'monthly' as 'monthly' | 'weekly' | 'yearly',
    recurringDay: initialData?.recurringDay || 1,
    nextPaymentDate: initialData?.nextPaymentDate || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Ödeme tarihi sadece tekrarlayan değilse veya yıllık tekrarlayanlar için zorunlu
    if (!formData.isRecurring || formData.recurringType === 'yearly') {
      if (!formData.paymentDate) {
        newErrors.paymentDate = 'Ödeme tarihi zorunludur';
      }
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

  const calculateNextPaymentDate = () => {
    if (!formData.isRecurring) return undefined;

    const now = new Date();

    switch (formData.recurringType) {
      case 'weekly':
        // Haftalık: Bu haftanın recurringDay gününü bulalım
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Pazar, 1=Pazartesi...
        const targetDay = formData.recurringDay; // 1=Pazartesi, 7=Pazar
        
        // JavaScript'te 0=Pazar, 1=Pazartesi... o yüzden convert edelim
        const jsTargetDay = targetDay === 7 ? 0 : targetDay; // 7=Pazar -> 0
        
        let daysUntilTarget = jsTargetDay - dayOfWeek;
        if (daysUntilTarget <= 0) {
          daysUntilTarget += 7; // Sonraki haftaya geç
        }
        
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntilTarget);
        return nextDate.toISOString().split('T')[0];

      case 'monthly':
        // Aylık: Bu ayın recurringDay gününü bulalım
        const thisMonth = new Date();
        thisMonth.setDate(formData.recurringDay);
        
        // Eğer bu ayın o günü geçtiyse, gelecek aya geç
        if (thisMonth <= now) {
          thisMonth.setMonth(thisMonth.getMonth() + 1);
        }
        
        return thisMonth.toISOString().split('T')[0];

      case 'yearly':
        // Yıllık: Belirtilen tarih
        if (!formData.paymentDate) return undefined;
        
        const yearlyDate = new Date(formData.paymentDate);
        const currentYear = now.getFullYear();
        yearlyDate.setFullYear(currentYear);
        
        // Eğer bu yılın o günü geçtiyse, gelecek yıla geç
        if (yearlyDate <= now) {
          yearlyDate.setFullYear(currentYear + 1);
        }
        
        return yearlyDate.toISOString().split('T')[0];

      default:
        return undefined;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Tekrarlayan ödeme için paymentDate'i ayarla
    let finalPaymentDate = formData.paymentDate;
    
    if (formData.isRecurring && formData.recurringType !== 'yearly') {
      // Aylık ve haftalık için sonraki ödeme tarihini kullan
      finalPaymentDate = calculateNextPaymentDate() || '';
    }

    const checkData: Omit<Check, 'id' | 'createdAt'> = {
      createdDate: formData.createdDate,
      paymentDate: finalPaymentDate,
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
      nextPaymentDate: calculateNextPaymentDate(),
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
              
              {/* Ödeme Tarihi - Sadece tekrarlayan değilse */}
              {!formData.isRecurring && (
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
              )}

              {/* Yıllık tekrarlayan için tarih */}
              {formData.isRecurring && formData.recurringType === 'yearly' && (
                <div>
                  <label className="theme-text block text-sm font-medium mb-2">
                    Yıllık Ödeme Tarihi *
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
              )}

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

            {/* Recurring Payment Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 theme-bg-secondary rounded-lg">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => handleChange('isRecurring', e.target.checked)}
                  className="theme-checkbox"
                />
                <label htmlFor="isRecurring" className="theme-text text-sm font-medium flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Tekrarlayan ödeme (düzenli olarak tekrarlanır)
                </label>
              </div>

              {formData.isRecurring && (
                <div className="pl-4 border-l-2 border-green-200 space-y-4">
                  
                  <div>
                    <label className="theme-text block text-sm font-medium mb-2">
                      Ne sıklıkla tekrarlanacak?
                    </label>
                    <select
                      value={formData.recurringType}
                      onChange={(e) => handleChange('recurringType', e.target.value)}
                      className="theme-input w-full"
                    >
                      <option value="weekly">Her hafta</option>
                      <option value="monthly">Her ay</option>
                      <option value="yearly">Her yıl</option>
                    </select>
                  </div>

                  {/* Aylık için gün seçimi */}
                  {formData.recurringType === 'monthly' && (
                    <div>
                      <label className="theme-text block text-sm font-medium mb-2">
                        Ayın hangi günü?
                      </label>
                      <select
                        value={formData.recurringDay}
                        onChange={(e) => handleChange('recurringDay', parseInt(e.target.value))}
                        className="theme-input w-full"
                      >
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>
                            {day}. gün
                          </option>
                        ))}
                      </select>
                      <p className="text-xs theme-text-muted mt-1">
                        Her ayın bu günü ödeme yapılacak
                      </p>
                    </div>
                  )}

                  {/* Haftalık için gün seçimi */}
                  {formData.recurringType === 'weekly' && (
                    <div>
                      <label className="theme-text block text-sm font-medium mb-2">
                        Haftanın hangi günü?
                      </label>
                      <select
                        value={formData.recurringDay}
                        onChange={(e) => handleChange('recurringDay', parseInt(e.target.value))}
                        className="theme-input w-full"
                      >
                        <option value={1}>Pazartesi</option>
                        <option value={2}>Salı</option>
                        <option value={3}>Çarşamba</option>
                        <option value={4}>Perşembe</option>
                        <option value={5}>Cuma</option>
                        <option value={6}>Cumartesi</option>
                        <option value={7}>Pazar</option>
                      </select>
                      <p className="text-xs theme-text-muted mt-1">
                        Her haftanın bu günü ödeme yapılacak
                      </p>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="text-sm text-green-700">
                        {formData.recurringType === 'yearly' ? (
                          <>
                            <strong>Tekrar:</strong> Her yıl {formData.paymentDate ? new Date(formData.paymentDate).toLocaleDateString('tr-TR') : 'Tarih seçin'} tarihinde
                          </>
                        ) : formData.recurringType === 'monthly' ? (
                          <>
                            <strong>Tekrar:</strong> Her ayın {formData.recurringDay}. günü
                            <br />
                            <strong>Sonraki ödeme:</strong> {calculateNextPaymentDate() ? new Date(calculateNextPaymentDate()!).toLocaleDateString('tr-TR') : 'Hesaplanıyor...'}
                          </>
                        ) : (
                          <>
                            <strong>Tekrar:</strong> Her {['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][formData.recurringDay]}
                            <br />
                            <strong>Sonraki ödeme:</strong> {calculateNextPaymentDate() ? new Date(calculateNextPaymentDate()!).toLocaleDateString('tr-TR') : 'Hesaplanıyor...'}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bill Type Selection (only for bills) */}
            {formData.type === 'bill' && (
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Fatura Türü
                </label>
                <select
                  value={formData.billType}
                  onChange={(e) => handleChange('billType', e.target.value)}
                  className="theme-input w-full"
                >
                  <option value="elektrik">Elektrik</option>
                  <option value="su">Su</option>
                  <option value="dogalgaz">Doğalgaz</option>
                  <option value="telefon">Telefon</option>
                  <option value="internet">İnternet</option>
                  <option value="diger">Diğer</option>
                </select>
                
                {formData.billType === 'diger' && (
                  <input
                    type="text"
                    placeholder="Fatura türünü belirtiniz"
                    value={formData.customBillType}
                    onChange={(e) => handleChange('customBillType', e.target.value)}
                    className="theme-input w-full mt-2"
                  />
                )}
              </div>
            )}

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