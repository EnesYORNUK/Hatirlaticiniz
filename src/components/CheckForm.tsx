import React, { useState } from 'react';
import { Check } from '../types';
import { Save, X } from 'lucide-react';

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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
      newErrors.signedTo = 'İmzalanan kişi gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        createdDate: formData.createdDate,
        paymentDate: formData.paymentDate,
        amount: Number(formData.amount),
        createdBy: formData.createdBy.trim(),
        signedTo: formData.signedTo.trim(),
        isPaid: formData.isPaid,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? 'Çek Düzenle' : 'Yeni Çek Ekle'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              İmzalanan Kişi *
            </label>
            <input
              type="text"
              name="signedTo"
              value={formData.signedTo}
              onChange={handleChange}
              placeholder="Adı Soyadı"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.signedTo ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.signedTo && (
              <p className="mt-1 text-sm text-red-600">{errors.signedTo}</p>
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