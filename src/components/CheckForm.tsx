import React, { useState } from 'react';
import { Check } from '../types';
import { Save, X, CreditCard, Receipt, Info } from 'lucide-react';

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
    isRecurring: false, // Karmaşık özelliği gizle
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
      isRecurring: false, // Basit tutuyoruz
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
    <div className="theme-bg min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="theme-surface rounded-2xl shadow-xl border-2 theme-border overflow-hidden">
          {/* Başlık */}
          <div className="theme-primary px-8 py-6">
            <div className="flex items-center gap-4">
              {formData.type === 'check' ? (
                <CreditCard className="w-10 h-10 text-white" />
              ) : (
                <Receipt className="w-10 h-10 text-white" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {initialData ? '✏️ Düzenle' : '➕ Yeni Ekle'}
                </h2>
                <p className="text-blue-100 text-lg">
                  {formData.type === 'check' ? 'Çek Bilgilerini Girin' : 'Fatura Bilgilerini Girin'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Bilgi Kutusu */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-blue-800 font-bold text-lg mb-2">Nasıl Kullanılır?</h3>
                  <p className="text-blue-700 leading-relaxed">
                    1️⃣ <strong>Ne ödüyorsunuz?</strong> Çek mi, fatura mı seçin<br/>
                    2️⃣ <strong>Ne kadar para?</strong> Ödeyeceğiniz tutarı yazın<br/>
                    3️⃣ <strong>Ne zaman?</strong> Ödeme tarihini seçin<br/>
                    4️⃣ <strong>Kim ödeyecek?</strong> Kendi adınızı yazın<br/>
                    5️⃣ <strong>Kime?</strong> Parayı alacak kişi/firma adını yazın
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Ne Ödüyorsunuz? */}
            <div className="space-y-4">
              <h3 className="theme-text text-xl font-bold flex items-center gap-2">
                1️⃣ Ne Ödüyorsunuz?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'check')}
                  className={`p-8 rounded-xl border-3 transition-all text-center ${
                    formData.type === 'check'
                      ? 'theme-primary border-blue-600 text-white shadow-lg transform scale-105'
                      : 'theme-surface theme-border theme-text hover:theme-bg-secondary hover:shadow-md'
                  }`}
                >
                  <CreditCard className="w-12 h-12 mx-auto mb-3" />
                  <div className="text-xl font-bold">💳 ÇEK</div>
                  <div className="text-sm mt-2 opacity-80">
                    Banka çeki, senet gibi
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('type', 'bill')}
                  className={`p-8 rounded-xl border-3 transition-all text-center ${
                    formData.type === 'bill'
                      ? 'theme-primary border-blue-600 text-white shadow-lg transform scale-105'
                      : 'theme-surface theme-border theme-text hover:theme-bg-secondary hover:shadow-md'
                  }`}
                >
                  <Receipt className="w-12 h-12 mx-auto mb-3" />
                  <div className="text-xl font-bold">🧾 FATURA</div>
                  <div className="text-sm mt-2 opacity-80">
                    Elektrik, su, telefon vs.
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Ne Kadar Para? */}
            <div className="space-y-4">
              <h3 className="theme-text text-xl font-bold flex items-center gap-2">
                2️⃣ Ne Kadar Para?
              </h3>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Örnek: 1500.50"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className={`theme-input w-full px-6 py-4 text-xl border-2 rounded-xl focus:ring-4 focus:ring-blue-200 ${
                    errors.amount ? 'border-red-500' : ''
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl font-bold theme-text-muted">
                  TL
                </div>
              </div>
              {errors.amount && (
                <p className="text-red-500 text-lg font-medium">{errors.amount}</p>
              )}
              <p className="theme-text-muted text-sm">
                💡 Virgülden sonra en fazla 2 rakam girebilirsiniz (örnek: 1234.56)
              </p>
            </div>

            {/* 3. Ne Zaman? */}
            <div className="space-y-4">
              <h3 className="theme-text text-xl font-bold flex items-center gap-2">
                3️⃣ Ne Zaman Ödenecek?
              </h3>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleChange('paymentDate', e.target.value)}
                className={`theme-input w-full px-6 py-4 text-xl border-2 rounded-xl focus:ring-4 focus:ring-blue-200 ${
                  errors.paymentDate ? 'border-red-500' : ''
                }`}
              />
              {errors.paymentDate && (
                <p className="text-red-500 text-lg font-medium">{errors.paymentDate}</p>
              )}
              <p className="theme-text-muted text-sm">
                📅 Bu tarihe yaklaştığında size hatırlatma göndereceğiz
              </p>
            </div>

            {/* 4. Kim Ödeyecek? */}
            <div className="space-y-4">
              <h3 className="theme-text text-xl font-bold flex items-center gap-2">
                4️⃣ Kim Ödeyecek?
              </h3>
              <input
                type="text"
                placeholder="Örnek: Ahmet Yılmaz"
                value={formData.createdBy}
                onChange={(e) => handleChange('createdBy', e.target.value)}
                className={`theme-input w-full px-6 py-4 text-xl border-2 rounded-xl focus:ring-4 focus:ring-blue-200 ${
                  errors.createdBy ? 'border-red-500' : ''
                }`}
              />
              {errors.createdBy && (
                <p className="text-red-500 text-lg font-medium">{errors.createdBy}</p>
              )}
              <p className="theme-text-muted text-sm">
                👤 Genellikle kendi adınızı yazarsınız
              </p>
            </div>

            {/* 5. Kime Ödenecek? */}
            <div className="space-y-4">
              <h3 className="theme-text text-xl font-bold flex items-center gap-2">
                5️⃣ Kime/Nereye Ödenecek?
              </h3>
              <input
                type="text"
                placeholder="Örnek: BEDAŞ, Vodafone, Ali Veli"
                value={formData.signedTo}
                onChange={(e) => handleChange('signedTo', e.target.value)}
                className={`theme-input w-full px-6 py-4 text-xl border-2 rounded-xl focus:ring-4 focus:ring-blue-200 ${
                  errors.signedTo ? 'border-red-500' : ''
                }`}
              />
              {errors.signedTo && (
                <p className="text-red-500 text-lg font-medium">{errors.signedTo}</p>
              )}
              <p className="theme-text-muted text-sm">
                🏢 Firma adı veya kişi adı yazabilirsiniz
              </p>
            </div>

            {/* 6. Ödendi Mi? */}
            <div className="space-y-4">
              <h3 className="theme-text text-xl font-bold flex items-center gap-2">
                6️⃣ Ödeme Durumu
              </h3>
              <div className="flex items-center gap-4 p-6 theme-bg-secondary rounded-xl border theme-border">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={formData.isPaid}
                  onChange={(e) => handleChange('isPaid', e.target.checked)}
                  className="w-6 h-6 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="isPaid" className="theme-text text-lg font-medium flex items-center gap-2">
                  {formData.isPaid ? (
                    <>✅ Bu ödeme yapıldı</>
                  ) : (
                    <>⏳ Henüz ödenmedi</>
                  )}
                </label>
              </div>
              <p className="theme-text-muted text-sm">
                ✅ Eğer parayı çoktan ödediyseniz, işaretleyin
              </p>
            </div>

            {/* Butonlar */}
            <div className="flex gap-4 pt-6 border-t-2 theme-border">
              <button
                type="submit"
                className="flex-1 theme-button px-8 py-4 text-xl rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                <Save className="w-6 h-6" />
                {initialData ? '✏️ GÜNCELLE' : '💾 KAYDET'}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="px-8 py-4 text-xl rounded-xl font-bold transition-all flex items-center justify-center gap-3 theme-button-secondary shadow-lg hover:shadow-xl"
              >
                <X className="w-6 h-6" />
                ❌ İPTAL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}