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

  const billTypeLabels = {
    elektrik: 'Elektrik',
    su: 'Su',
    dogalgaz: 'Doğalgaz',
    telefon: 'Telefon',
    internet: 'İnternet',
    diger: 'Diğer'
  };

  const recurringTypeLabels = {
    monthly: 'Aylık',
    weekly: 'Haftalık',
    yearly: 'Yıllık'
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Ödeme tarihi gereklidir';
    } else if (new Date(formData.paymentDate) <= new Date(formData.createdDate)) {
      newErrors.paymentDate = 'Ödeme tarihi, oluşturma tarihinden sonra olmalıdır';
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Geçerli bir miktar giriniz';
    }

    if (!formData.createdBy.trim()) {
      newErrors.createdBy = 'Oluşturan kişi gereklidir';
    }

    if (!formData.signedTo.trim()) {
      newErrors.signedTo = 'Ödenecek firma/kişi gereklidir';
    }

    if (formData.type === 'bill' && formData.billType === 'diger' && !formData.customBillType.trim()) {
      newErrors.customBillType = 'Özel fatura türü gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateNextPaymentDate = (data = formData) => {
    if (!data.isRecurring || !data.paymentDate) return '';
    
    const currentDate = new Date(data.paymentDate);
    let nextDate = new Date(currentDate);

    switch (data.recurringType) {
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + 1);
        nextDate.setDate(data.recurringDay);
        break;
      case 'yearly':
        nextDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }

    return nextDate.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const nextPaymentDate = formData.isRecurring ? generateNextPaymentDate() : undefined;
      
      onSave({
        createdDate: formData.createdDate,
        paymentDate: formData.paymentDate,
        amount: Number(formData.amount),
        createdBy: formData.createdBy.trim(),
        signedTo: formData.signedTo.trim(),
        isPaid: formData.isPaid,
        type: formData.type,
        billType: formData.type === 'bill' ? formData.billType : undefined,
        customBillType: formData.type === 'bill' && formData.billType === 'diger' ? formData.customBillType.trim() : undefined,
        isRecurring: formData.isRecurring,
        recurringType: formData.isRecurring ? formData.recurringType : undefined,
        recurringDay: formData.isRecurring ? formData.recurringDay : undefined,
        nextPaymentDate,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    
    let newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    // Ödeme tarihi değiştiğinde veya tekrarlayan ödeme seçildiğinde
    // ayın kaçında değerini otomatik güncelle
    if (name === 'paymentDate' && value && newFormData.isRecurring) {
      const selectedDate = new Date(value);
      newFormData.recurringDay = selectedDate.getDate();
      newFormData.nextPaymentDate = generateNextPaymentDate(newFormData);
    } else if (name === 'isRecurring' && checked && formData.paymentDate) {
      const selectedDate = new Date(formData.paymentDate);
      newFormData.recurringDay = selectedDate.getDate();
      newFormData.nextPaymentDate = generateNextPaymentDate(newFormData);
    }

    setFormData(newFormData);

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? `${formData.type === 'check' ? 'Çek' : 'Fatura'} Düzenle` : `Yeni ${formData.type === 'check' ? 'Çek' : 'Fatura'} Ekle`}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Çek/Fatura Seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ödeme Türü
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'check' }))}
              className={`flex items-center justify-center space-x-2 p-3 border-2 rounded-lg transition-colors ${
                formData.type === 'check' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <span>Çek</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'bill' }))}
              className={`flex items-center justify-center space-x-2 p-3 border-2 rounded-lg transition-colors ${
                formData.type === 'bill' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Receipt className="h-5 w-5" />
              <span>Fatura</span>
            </button>
          </div>
        </div>

        {/* Fatura Türü Seçimi */}
        {formData.type === 'bill' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fatura Türü
            </label>
            <select
              name="billType"
              value={formData.billType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {Object.entries(billTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Özel Fatura Türü */}
        {formData.type === 'bill' && formData.billType === 'diger' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Özel Fatura Türü *
            </label>
            <input
              type="text"
              name="customBillType"
              value={formData.customBillType}
              onChange={handleChange}
              placeholder="Örn: Kira, Sigorta, vb."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.customBillType ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.customBillType && (
              <p className="mt-1 text-sm text-red-600">{errors.customBillType}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oluşturma Tarihi
            </label>
            <input
              type="date"
              name="createdDate"
              value={formData.createdDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ödeme Tarihi *
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.paymentDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.paymentDate && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miktar (TL) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oluşturan Kişi *
            </label>
            <input
              type="text"
              name="createdBy"
              value={formData.createdBy}
              onChange={handleChange}
              placeholder="Adı Soyadı"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.createdBy ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.createdBy && (
              <p className="mt-1 text-sm text-red-600">{errors.createdBy}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ödenecek Firma/Kişi *
            </label>
            <input
              type="text"
              name="signedTo"
              value={formData.signedTo}
              onChange={handleChange}
              placeholder="Firma/Kişi Adı"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.signedTo ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.signedTo && (
              <p className="mt-1 text-sm text-red-600">{errors.signedTo}</p>
            )}
          </div>
        </div>

        {/* Tekrarlama Ayarları */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Tekrarlayan Ödeme
            </label>
          </div>

          {formData.isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tekrar Türü
                </label>
                <select
                  name="recurringType"
                  value={formData.recurringType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {Object.entries(recurringTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.recurringType === 'monthly' ? 'Ayın Kaçında' : 
                   formData.recurringType === 'weekly' ? 'Haftanın Günü' : 'Gün'}
                </label>
                <input
                  type="number"
                  name="recurringDay"
                  value={formData.recurringDay}
                  onChange={handleChange}
                  min={formData.recurringType === 'weekly' ? 1 : 1}
                  max={formData.recurringType === 'weekly' ? 7 : formData.recurringType === 'monthly' ? 31 : 31}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {formData.recurringType === 'weekly' && (
                  <p className="text-xs text-gray-500 mt-1">1=Pazartesi, 7=Pazar</p>
                )}
                {formData.recurringType === 'monthly' && (
                  <p className="text-xs text-gray-500 mt-1">Örn: 15 (Her ayın 15'inde)</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isPaid"
              checked={formData.isPaid}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Ödendi olarak işaretle</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Kaydet</span>
          </button>
        </div>
      </form>
    </div>
  );
}