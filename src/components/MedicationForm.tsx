import React, { useState } from 'react';
import { Medication } from '../types/medication';
import { Save, X, Pill, Clock, Calendar, Repeat, AlertCircle } from 'lucide-react';

interface MedicationFormProps {
  onSave: (medication: Omit<Medication, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Medication;
}

const weekDays = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 7, label: 'Pazar' },
];

export default function MedicationForm({ onSave, onCancel, initialData }: MedicationFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    dosage: initialData?.dosage || '',
    frequency: initialData?.frequency || 'daily' as 'daily' | 'weekly' | 'monthly',
    time: initialData?.time || '08:00',
    weekDay: initialData?.weekDay || 1,
    monthDay: initialData?.monthDay || 1,
    isActive: initialData?.isActive ?? true,
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate || '',
    notes: initialData?.notes || '',
    createdBy: initialData?.createdBy || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Hap adı zorunludur';
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = 'Doz bilgisi zorunludur';
    }

    if (!formData.time) {
      newErrors.time = 'Saat zorunludur';
    }

    if (!formData.createdBy.trim()) {
      newErrors.createdBy = 'Kim kullanacak bilgisi zorunludur';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Başlangıç tarihi zorunludur';
    }

    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'Bitiş tarihi başlangıçtan sonra olmalıdır';
    }

    if (formData.frequency === 'monthly' && (formData.monthDay < 1 || formData.monthDay > 31)) {
      newErrors.monthDay = 'Geçerli bir gün seçiniz (1-31)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const medicationData: Omit<Medication, 'id' | 'createdAt'> = {
      name: formData.name.trim(),
      dosage: formData.dosage.trim(),
      frequency: formData.frequency,
      time: formData.time,
      weekDay: formData.frequency === 'weekly' ? formData.weekDay : undefined,
      monthDay: formData.frequency === 'monthly' ? formData.monthDay : undefined,
      isActive: formData.isActive,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      notes: formData.notes.trim() || undefined,
      createdBy: formData.createdBy.trim(),
    };

    onSave(medicationData);
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
          
          {/* Header */}
          <div className="theme-primary px-6 py-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Pill className="w-5 h-5 text-white" />
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {initialData ? 'Hap Düzenle' : 'Yeni Hap Ekle'}
                </h2>
                <p className="text-blue-100 text-sm">
                  Hap bilgilerini girin ve zamanını ayarlayın
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Hap Adı */}
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Hap Adı *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Aspirin, Vitamin D"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`theme-input w-full ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Doz */}
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Doz *
                </label>
                <input
                  type="text"
                  placeholder="Örn: 1 tablet, 5ml, 2 damla"
                  value={formData.dosage}
                  onChange={(e) => handleChange('dosage', e.target.value)}
                  className={`theme-input w-full ${errors.dosage ? 'border-red-500' : ''}`}
                />
                {errors.dosage && (
                  <p className="text-red-500 text-sm mt-1">{errors.dosage}</p>
                )}
              </div>
            </div>

            {/* Sıklık ve Zaman */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Sıklık */}
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Sıklık *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => handleChange('frequency', e.target.value)}
                  className="theme-input w-full"
                >
                  <option value="daily">Her gün</option>
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                </select>
              </div>

              {/* Gün Seçimi (haftalık için) */}
              {formData.frequency === 'weekly' && (
                <div>
                  <label className="theme-text block text-sm font-medium mb-2">
                    Hangi gün?
                  </label>
                  <select
                    value={formData.weekDay}
                    onChange={(e) => handleChange('weekDay', parseInt(e.target.value))}
                    className="theme-input w-full"
                  >
                    {weekDays.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Gün Seçimi (aylık için) */}
              {formData.frequency === 'monthly' && (
                <div>
                  <label className="theme-text block text-sm font-medium mb-2">
                    Ayın hangi günü?
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.monthDay}
                    onChange={(e) => handleChange('monthDay', parseInt(e.target.value) || 1)}
                    className={`theme-input w-full ${errors.monthDay ? 'border-red-500' : ''}`}
                  />
                  {errors.monthDay && (
                    <p className="text-red-500 text-sm mt-1">{errors.monthDay}</p>
                  )}
                </div>
              )}

              {/* Saat */}
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Saat *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  className={`theme-input w-full ${errors.time ? 'border-red-500' : ''}`}
                />
                {errors.time && (
                  <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                )}
              </div>
            </div>

            {/* Tarih Aralığı */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Kim Kullanacak */}
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Kim Kullanacak *
                </label>
                <input
                  type="text"
                  placeholder="Adınızı girin"
                  value={formData.createdBy}
                  onChange={(e) => handleChange('createdBy', e.target.value)}
                  className={`theme-input w-full ${errors.createdBy ? 'border-red-500' : ''}`}
                />
                {errors.createdBy && (
                  <p className="text-red-500 text-sm mt-1">{errors.createdBy}</p>
                )}
              </div>

              {/* Başlangıç Tarihi */}
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Başlangıç Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className={`theme-input w-full ${errors.startDate ? 'border-red-500' : ''}`}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              {/* Bitiş Tarihi */}
              <div>
                <label className="theme-text block text-sm font-medium mb-2">
                  Bitiş Tarihi (İsteğe bağlı)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className={`theme-input w-full ${errors.endDate ? 'border-red-500' : ''}`}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Notlar */}
            <div>
              <label className="theme-text block text-sm font-medium mb-2">
                Notlar (İsteğe bağlı)
              </label>
              <textarea
                rows={3}
                placeholder="Özel notlar, yan etkiler, doktor tavsiyeleri..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="theme-input w-full resize-none"
              />
            </div>

            {/* Aktif/Pasif */}
            <div className="flex items-center gap-3 p-3 theme-bg-secondary rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="theme-checkbox"
              />
              <label htmlFor="isActive" className="theme-text text-sm font-medium flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Bu hap aktif (Hatırlatmalar gelsin)
              </label>
            </div>

            {/* Bilgi Kutusu */}
            <div className="theme-bg-secondary border theme-border rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 theme-primary mt-0.5" />
                <div className="text-sm theme-text">
                  <strong>Bilgi:</strong> Hap zamanı geldiğinde size bildirim gönderilecektir.
                  {formData.frequency === 'weekly' && formData.weekDay && (
                    <span className="ml-1">
                      Her <strong>{weekDays.find(d => d.value === formData.weekDay)?.label}</strong> günü 
                      <strong> {formData.time}</strong> saatinde hatırlatılacak.
                    </span>
                  )}
                  {formData.frequency === 'daily' && (
                    <span className="ml-1">
                      Her gün <strong>{formData.time}</strong> saatinde hatırlatılacak.
                    </span>
                  )}
                  {formData.frequency === 'monthly' && (
                    <span className="ml-1">
                      Her ayın <strong>{formData.monthDay}.</strong> günü 
                      <strong> {formData.time}</strong> saatinde hatırlatılacak.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Butonlar */}
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