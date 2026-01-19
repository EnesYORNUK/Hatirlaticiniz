import React, { useState, useMemo } from 'react';
import { Check } from '../types';
import { Save, X, CreditCard, Receipt, Calendar, Repeat } from 'lucide-react';

interface CheckFormProps {
  onSave: (check: Omit<Check, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Check;
  forceType?: 'check' | 'bill';
}

export default function CheckForm({ onSave, onCancel, initialData, forceType }: CheckFormProps) {
  const [formData, setFormData] = useState({
    createdDate: initialData?.createdDate || new Date().toISOString().split('T')[0],
    paymentDate: initialData?.paymentDate || '',
    amount: initialData?.amount?.toString() || '',
    createdBy: initialData?.createdBy || '',
    signedTo: initialData?.signedTo || '',
    isPaid: initialData?.isPaid || false,
    type: (forceType || initialData?.type || 'check') as 'check' | 'bill',
    billType: initialData?.billType || 'elektrik' as 'elektrik' | 'su' | 'dogalgaz' | 'telefon' | 'internet' | 'diger',
    customBillType: initialData?.customBillType || '',
    isRecurring: (forceType === 'bill') ? true : (initialData?.isRecurring || false),
    recurringType: (initialData?.recurringType || 'monthly') as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurringDay: initialData?.recurringDay || 1,
    recurringDays: initialData?.recurringDays || [],
    recurringEndCount: initialData?.recurringEndCount || undefined,
    recurringEndMonths: initialData?.recurringEndMonths || undefined,
    recurringEndDate: initialData?.recurringEndDate || undefined,
    nextPaymentDate: initialData?.nextPaymentDate || undefined,
  });

  const displayType = useMemo(() => (forceType ? forceType : formData.type), [forceType, formData.type]);

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
    let baseDate: Date;

    // Base date'i belirle
    if (formData.recurringType === 'yearly' && formData.paymentDate) {
      // Yıllık için seçilen tarihi kullan
      baseDate = new Date(formData.paymentDate);
    } else {
      // Aylık ve haftalık için bugünü kullan
      baseDate = new Date();
    }

    let nextDate = new Date(baseDate);

    switch (formData.recurringType) {
      case 'daily':
        nextDate = new Date(now);
        nextDate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        // Haftalık: bir veya birden fazla gün seçilebilir
        const selectedDays = (formData.recurringDays && formData.recurringDays.length > 0)
          ? formData.recurringDays
          : [formData.recurringDay];

        const dayOfWeek = now.getDay(); // 0=Pazar, 1=Pazartesi...
        // Map selected days (1-7, Pazartesi=1 ... Pazar=7) to JS days (1-6,0)
        const jsDays = selectedDays.map(d => (d === 7 ? 0 : d));

        // Find the soonest upcoming selected day
        const daysUntilList = jsDays.map(jsTarget => {
          let diff = jsTarget - dayOfWeek;
          if (diff <= 0) diff += 7;
          return diff;
        });
        const minDiff = Math.min(...daysUntilList);
        nextDate = new Date(now);
        nextDate.setDate(now.getDate() + minDiff);
        break;

      case 'monthly':
        // Aylık: Bu ayın recurringDay gününü bulalım
        nextDate = new Date(now);
        nextDate.setDate(formData.recurringDay);
        
        // Eğer bu ayın o günü geçtiyse, gelecek aya geç
        if (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;

      case 'yearly':
        // Yıllık: Belirtilen tarih
        if (!formData.paymentDate) return undefined;
        
        nextDate = new Date(formData.paymentDate);
        const currentYear = now.getFullYear();
        nextDate.setFullYear(currentYear);
        
        // Eğer bu yılın o günü geçtiyse, gelecek yıla geç
        if (nextDate <= now) {
          nextDate.setFullYear(currentYear + 1);
        }
        break;

      default:
        return undefined;
    }

    console.log(`📅 ${formData.recurringType} tekrarlayan ödeme - Sonraki tarih:`, nextDate.toISOString().split('T')[0]);
    return nextDate.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Kullanıcıya görsel geri bildirim ver
      const firstError = Object.values(errors)[0] || 'Lütfen zorunlu alanları doldurunuz';
      alert(`Kaydedilemedi: ${firstError}`);
      return;
    }

    // Tekrarlayan ödeme için paymentDate'i ayarla
    let finalPaymentDate = formData.paymentDate;
    let finalNextPaymentDate = undefined;
    
    if (formData.isRecurring) {
      if (formData.recurringType === 'yearly') {
        // Yıllık için paymentDate kullan
        finalPaymentDate = formData.paymentDate;
        finalNextPaymentDate = calculateNextPaymentDate();
      } else {
        // Aylık ve haftalık için bugünün tarihini kullan
        const today = new Date();
        finalPaymentDate = today.toISOString().split('T')[0];
        finalNextPaymentDate = calculateNextPaymentDate();
      }
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
      recurringDays: formData.recurringDays,
      recurringEndCount: formData.recurringEndCount,
      recurringEndMonths: formData.recurringEndMonths,
      recurringEndDate: formData.recurringEndDate,
      nextPaymentDate: finalNextPaymentDate,
    };

    console.log('💾 Kaydedilecek veri:', checkData);
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
              {displayType === 'check' ? (
                <CreditCard className="w-5 h-5 text-white" />
              ) : (
                <Receipt className="w-5 h-5 text-white" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {initialData ? 'Düzenle' : 'Yeni Ekle'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {displayType === 'check' ? 'Çek bilgilerini girin' : 'Fatura bilgilerini girin'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Bill Type Selection moved to top for bills */}
            {displayType === 'bill' && (
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
            
            {/* Type Selection */}
            {!forceType && (
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
            )}

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
              {displayType !== 'bill' && (
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
              )}

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
                      <option value="daily">Her gün</option>
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

                  {/* Haftalık için gün seçimi (birden fazla gün) */}
                  {formData.recurringType === 'weekly' && (
                    <div>
                      <label className="theme-text block text-sm font-medium mb-2">
                        Haftanın hangi günleri?
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 1, label: 'Pazartesi' },
                          { id: 2, label: 'Salı' },
                          { id: 3, label: 'Çarşamba' },
                          { id: 4, label: 'Perşembe' },
                          { id: 5, label: 'Cuma' },
                          { id: 6, label: 'Cumartesi' },
                          { id: 7, label: 'Pazar' },
                        ].map(day => (
                          <label key={day.id} className="flex items-center gap-2 p-2 rounded-md theme-bg-secondary">
                            <input
                              type="checkbox"
                              checked={formData.recurringDays.includes(day.id) || formData.recurringDay === day.id}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                if (checked) {
                                  const nextDays = Array.from(new Set([...(formData.recurringDays || []), day.id]));
                                  handleChange('recurringDays', nextDays);
                                  // İlk seçimi recurringDay'a yansıt
                                  if (!formData.recurringDay) handleChange('recurringDay', day.id);
                                } else {
                                  const nextDays = (formData.recurringDays || []).filter(d => d !== day.id);
                                  handleChange('recurringDays', nextDays);
                                  // Hiç kalmadıysa recurringDay'ı temizle
                                  if (nextDays.length === 0) handleChange('recurringDay', 1);
                                }
                              }}
                            />
                            <span className="text-sm">{day.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs theme-text-muted mt-1">
                        Seçilen günlerden en yakını bir sonraki ödeme tarihi olarak hesaplanır.
                      </p>
                    </div>
                  )}

                  {/* Opsiyonel bitiş koşulları */}
                  <div>
                    <label className="theme-text block text-sm font-medium mb-2">
                      Bitiş (opsiyonel)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Kaç kez tekrarlansın?"
                        value={formData.recurringEndCount ?? ''}
                        onChange={(e) => handleChange('recurringEndCount', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="theme-input w-full"
                      />
                      <input
                        type="number"
                        placeholder="Kaç ay sonra bitsin?"
                        value={formData.recurringEndMonths ?? ''}
                        onChange={(e) => handleChange('recurringEndMonths', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="theme-input w-full"
                      />
                      <input
                        type="date"
                        placeholder="Bitiş tarihi"
                        value={formData.recurringEndDate ?? ''}
                        onChange={(e) => handleChange('recurringEndDate', e.target.value || undefined)}
                        className="theme-input w-full"
                      />
                    </div>
                  </div>

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
                        ) : formData.recurringType === 'weekly' ? (
                          <>
                            <strong>Tekrar:</strong> Her {(
                              (formData.recurringDays && formData.recurringDays.length > 0 ? formData.recurringDays : [formData.recurringDay])
                                .map(d => ['','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'][d])
                                .join(', ')
                            )}
                            <br />
                            <strong>Sonraki ödeme:</strong> {calculateNextPaymentDate() ? new Date(calculateNextPaymentDate()!).toLocaleDateString('tr-TR') : 'Hesaplanıyor...'}
                          </>
                        ) : (
                          <>
                            <strong>Tekrar:</strong> Her gün
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

            {/* Bill Type Selection removed from bottom (moved to top) */}

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