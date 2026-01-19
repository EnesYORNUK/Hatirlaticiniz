import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, CreditCard, Pill, Info, Receipt } from 'lucide-react';
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
    if (type === 'bill' || type === 'medication' || type === 'check') return type;
    return 'check';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<'check' | 'bill' | 'medication'>(initialTab as 'check' | 'bill' | 'medication');

  const switchTab = (tab: 'check' | 'bill' | 'medication') => {
    setActiveTab(tab);
    const search = `?type=${tab}`;
    navigate({ pathname: '/add', search }, { replace: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <div className="flex items-center gap-3">
          <div className="theme-primary rounded-lg p-2.5">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold theme-text">Yeni Ekle</h1>
            <p className="theme-text-muted text-sm">Ödeme veya ilaç ekleyin</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border overflow-hidden">
        <div className="p-4 border-b theme-border">
          <div className="flex gap-2">
            <button
              onClick={() => switchTab('check')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'check'
                  ? 'theme-primary text-white shadow-md'
                  : 'theme-text-muted hover:theme-bg-secondary'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Çek
            </button>
            <button
              onClick={() => switchTab('bill')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'bill'
                  ? 'theme-primary text-white shadow-md'
                  : 'theme-text-muted hover:theme-bg-secondary'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Fatura
            </button>
            <button
              onClick={() => switchTab('medication')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'medication'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'theme-text-muted hover:theme-bg-secondary'
              }`}
            >
              <Pill className="w-4 h-4" />
              İlaç
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'check' && (
            <CheckForm onSave={onAddCheck} onCancel={onCancel} forceType="check" />
          )}
          {activeTab === 'bill' && (
            <CheckForm onSave={onAddCheck} onCancel={onCancel} forceType="bill" />
          )}
          {activeTab === 'medication' && (
            <MedicationForm onSave={onAddMedication} onCancel={onCancel} />
          )}
        </div>
      </div>
    </div>
  );
}