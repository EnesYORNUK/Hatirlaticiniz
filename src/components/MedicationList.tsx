import { useNavigate } from 'react-router-dom';
import { 
  Edit2, 
  Trash2, 
  Clock, 
  Calendar, 
  Pill,
  Play,
  Pause,
  Activity
} from 'lucide-react';
import { Medication } from '../types/medication';
import { useSupabaseMedications } from '../hooks/useSupabaseMedications';

const weekDayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export default function MedicationList() {
  const navigate = useNavigate();
  const { medications, deleteMedication, updateMedication } = useSupabaseMedications();

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateMedication(id, { isActive });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu ilacı silmek istediğinizden emin misiniz?')) {
      await deleteMedication(id);
    }
  };

  const handleEdit = (medication: Medication) => {
    navigate(`/medications/edit/${medication.id}`);
  };

  if (medications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-full mb-4">
          <Pill className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">İlaç Listeniz Boş</h3>
        <p className="text-slate-500 text-center max-w-sm">
          Düzenli takip etmek istediğiniz ilaçları ekleyerek başlayın.
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-600" />
            İlaçlarım
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Toplam {medications.length} kayıt, {medications.filter(m => m.isActive).length} aktif
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.map((medication) => (
          <div
            key={medication.id}
            className={`group relative bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-300 ${
              medication.isActive 
                ? 'border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800' 
                : 'border-slate-100 dark:border-slate-800 opacity-75 grayscale-[0.5]'
            }`}
          >
            {/* Durum Badge */}
            <div className="absolute top-4 right-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                medication.isActive
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                {medication.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${
                  medication.isActive 
                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">
                    {medication.name}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">
                    {medication.dosage}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">{medication.time}</span>
                </div>
                
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>{getFrequencyText(medication)}</span>
                </div>

                {medication.notes && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">
                    "{medication.notes}"
                  </p>
                )}
              </div>

              {/* Aksiyonlar - Hover ile görünür veya mobilde her zaman görünür */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleActive(medication.id, !medication.isActive)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    medication.isActive
                      ? 'hover:bg-orange-50 text-slate-500 hover:text-orange-600'
                      : 'hover:bg-teal-50 text-slate-500 hover:text-teal-600'
                  }`}
                  title={medication.isActive ? "Pasife Al" : "Aktifleştir"}
                >
                  {medication.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {medication.isActive ? 'Durdur' : 'Başlat'}
                </button>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

                <button
                  onClick={() => handleEdit(medication)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Düzenle
                </button>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

                <button
                  onClick={() => handleDelete(medication.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
