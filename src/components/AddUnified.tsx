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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-600 rounded-xl p-2.5">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Ekle</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Ödeme veya ilaç ekleyin</p>
          </div>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 mt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <div className="text-sm text-indigo-700 dark:text-indigo-300">
              <strong>İpucu:</strong> Sekmeler arası geçiş yaparak çek/fatura veya ilaç ekleyebilirsiniz.
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <button
              onClick={() => switchTab('check')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'check'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Çek
            </button>
            <button
              onClick={() => switchTab('bill')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'bill'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Fatura
            </button>
            <button
              onClick={() => switchTab('medication')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'medication'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
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