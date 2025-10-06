import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, CreditCard, Pill, Info } from 'lucide-react';
import CheckForm from './CheckForm';
import MedicationForm from './MedicationForm';
import { Check } from '../types';
import { Medication } from '../types/medication';

interface AddUnifiedProps {
  onAddCheck: (check: Omit<Check, 'id' | 'createdAt'>) => void;
  onAddMedication: (medication: Omit<Medication, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function AddUnified({ onAddCheck, onAddMedication, onCancel }: AddUnifiedProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    return type === 'medication' ? 'medication' : 'payment';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<'payment' | 'medication'>(initialTab as 'payment' | 'medication');

  const switchTab = (tab: 'payment' | 'medication') => {
    setActiveTab(tab);
    const search = tab === 'medication' ? '?type=medication' : '';
    navigate({ pathname: '/add', search }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="theme-primary rounded-lg p-2.5">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold theme-text">Yeni Ekle</h1>
            <p className="theme-text-muted text-sm">Ödeme veya ilaç ekleyin</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <strong>İpucu:</strong> Sekmeler arası geçiş yaparak çek/fatura veya ilaç ekleyebilirsiniz.
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border">
        <div className="p-4 border-b theme-border">
          <div className="flex gap-2">
            <button
              onClick={() => switchTab('payment')}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                activeTab === 'payment'
                  ? 'theme-primary text-white'
                  : 'theme-button-secondary'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Ödeme (Çek/Fatura)
            </button>
            <button
              onClick={() => switchTab('medication')}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                activeTab === 'medication'
                  ? 'theme-primary text-white'
                  : 'theme-button-secondary'
              }`}
            >
              <Pill className="w-4 h-4" />
              İlaç
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'payment' ? (
            <CheckForm onSave={onAddCheck} onCancel={onCancel} />
          ) : (
            <MedicationForm onSave={onAddMedication} onCancel={() => navigate('/medications')} />
          )}
        </div>
      </div>
    </div>
  );
}