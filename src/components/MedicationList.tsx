import React, { useState } from 'react';
import { Medication } from '../types/medication';
import { 
  Pill, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar, 
  User, 
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

interface MedicationListProps {
  medications: Medication[];
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const weekDayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export default function MedicationList({ medications, onEdit, onDelete, onToggleActive }: MedicationListProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  if (medications.length === 0) {
    return (
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-8 text-center">
        <Pill className="w-12 h-12 theme-text-muted mx-auto mb-3" />
        <h3 className="theme-text text-lg font-medium mb-2">Henüz hap eklenmemiş</h3>
        <p className="theme-text-muted text-sm mb-4">
          Hap takibinizi başlatmak için ilk hapınızı ekleyin
        </p>
      </div>
    );
  }

  const getFrequencyText = (medication: Medication) => {
    switch (medication.frequency) {
      case 'daily':
        return 'Her gün';
      case 'weekly':
        return `Her ${weekDayNames[medication.weekDay === 7 ? 0 : medication.weekDay || 1]}`;
      case 'monthly':
        return `Her ayın ${medication.monthDay}. günü`;
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`"${name}" hapını silmek istediğinizden emin misiniz?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="theme-text text-lg font-semibold">Hap Listesi</h2>
          <p className="theme-text-muted text-sm">
            {medications.length} hap • {medications.filter(m => m.isActive).length} aktif
          </p>
        </div>
      </div>

      {/* Medication Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medications.map((medication) => (
          <div
            key={medication.id}
            className={`theme-surface rounded-lg shadow-sm border theme-border transition-all duration-200 ${
              expandedCard === medication.id ? 'ring-2 ring-blue-200' : ''
            } ${!medication.isActive ? 'opacity-60' : ''}`}
          >
            
            {/* Card Header */}
            <div className="p-4 border-b theme-border">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${medication.isActive ? 'theme-primary' : 'bg-gray-400'}`}>
                    <Pill className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="theme-text font-semibold">{medication.name}</h3>
                      {!medication.isActive && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Pasif
                        </span>
                      )}
                    </div>
                    <p className="theme-text-muted text-sm">{medication.dosage}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setExpandedCard(expandedCard === medication.id ? null : medication.id)}
                  className="p-1 theme-text-muted hover:theme-text transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3">
              
              {/* Zaman ve Sıklık */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 theme-text-muted">
                  <Clock className="w-3 h-3" />
                  <span>{medication.time}</span>
                </div>
                <div className="flex items-center gap-1 theme-text-muted">
                  <Calendar className="w-3 h-3" />
                  <span>{getFrequencyText(medication)}</span>
                </div>
              </div>

              {/* Kullanıcı */}
              <div className="flex items-center gap-1 text-sm theme-text-muted">
                <User className="w-3 h-3" />
                <span>{medication.createdBy}</span>
              </div>

              {/* Tarih Aralığı */}
              <div className="text-xs theme-text-muted">
                {formatDate(medication.startDate)}
                {medication.endDate && ` - ${formatDate(medication.endDate)}`}
              </div>

              {/* Notlar */}
              {medication.notes && (
                <div className="text-xs theme-text-muted bg-gray-50 p-2 rounded">
                  {medication.notes}
                </div>
              )}
            </div>

            {/* Expanded Actions */}
            {expandedCard === medication.id && (
              <div className="border-t theme-border p-3 bg-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  
                  {/* Aktif/Pasif Toggle */}
                  <button
                    onClick={() => onToggleActive(medication.id, !medication.isActive)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      medication.isActive
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {medication.isActive ? (
                      <>
                        <Pause className="w-3 h-3" />
                        Pasif Yap
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Aktif Yap
                      </>
                    )}
                  </button>

                  {/* Düzenle */}
                  <button
                    onClick={() => onEdit(medication)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Düzenle
                  </button>

                  {/* Sil */}
                  <button
                    onClick={() => handleDelete(medication.id, medication.name)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors col-span-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Sil
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}