import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Receipt, Pill } from 'lucide-react';
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
      {/* Tabs */}
      <div className="flex justify-center w-full">
        <div className="theme-surface p-1.5 rounded-xl shadow-sm border theme-border inline-flex gap-1">
          <button
            onClick={() => switchTab('check')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
              activeTab === 'check'
                ? 'theme-primary text-white shadow-sm'
                : 'theme-text-muted hover:theme-bg-secondary hover:theme-text'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Çek
          </button>
          <button
            onClick={() => switchTab('bill')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
              activeTab === 'bill'
                ? 'theme-primary text-white shadow-sm'
                : 'theme-text-muted hover:theme-bg-secondary hover:theme-text'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Fatura
          </button>
          <button
            onClick={() => switchTab('medication')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
              activeTab === 'medication'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'theme-text-muted hover:theme-bg-secondary hover:theme-text'
            }`}
          >
            <Pill className="w-4 h-4" />
            İlaç
          </button>
        </div>
      </div>

      <div className="animate-fade-in">
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
  );
}