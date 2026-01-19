import { useState, useMemo } from 'react';
import { MedicationScheduleItem } from '../types/medication';
import { 
  Pill, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X,
  Calendar,
} from 'lucide-react';

interface DailyScheduleProps {
  medicationSchedule: MedicationScheduleItem[];
  onMarkMedicationTaken: (medicationId: string, scheduledTime: string, status: 'taken' | 'missed' | 'skipped', notes?: string) => void;
}

export default function DailySchedule({ 
  medicationSchedule, 
  onMarkMedicationTaken,
}: DailyScheduleProps) {
  const [selectedMedication, setSelectedMedication] = useState<MedicationScheduleItem | null>(null);
  const [medicationNotes, setMedicationNotes] = useState('');

  const sortedActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'medication';
      time: string;
      title: string;
      subtitle: string;
      status: 'pending' | 'completed' | 'missed' | 'overdue';
      data: MedicationScheduleItem;
    }> = [];

    medicationSchedule.forEach(item => {
      activities.push({
        id: item.medication.id,
        type: 'medication',
        time: item.scheduledTime,
        title: item.medication.name,
        subtitle: `${item.medication.dosage}`,
        status: item.status === 'taken' ? 'completed' : 
                item.status === 'missed' ? 'missed' : 'pending',
        data: item
      });
    });

    return activities.sort((a, b) => a.time.localeCompare(b.time));
  }, [medicationSchedule]);

  const handleMedicationAction = (status: 'taken' | 'missed' | 'skipped') => {
    if (!selectedMedication) return;
    onMarkMedicationTaken(
      selectedMedication.medication.id, 
      selectedMedication.scheduledTime, 
      status, 
      medicationNotes.trim() || undefined
    );
    setSelectedMedication(null);
    setMedicationNotes('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'missed':
        return <X className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50';
      case 'missed':
        return 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50';
      case 'overdue':
        return 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/50';
      default:
        return 'bg-blue-50/30 dark:bg-blue-900/5 border-blue-100 dark:border-blue-800/30';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stats = {
    total: sortedActivities.length,
    completed: sortedActivities.filter(a => a.status === 'completed').length,
    pending: sortedActivities.filter(a => a.status === 'pending').length,
    missed: sortedActivities.filter(a => a.status === 'missed' || a.status === 'overdue').length
  };

  return (
    <div className="space-y-6">
      
      {/* Stats Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Günlük Program</h1>
            <p className="text-slate-500 text-sm font-medium">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-1">Toplam</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 mt-1">Alındı</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 mt-1">Bekliyor</div>
          </div>
          <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800/30">
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">{stats.missed}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300 mt-1">Kaçan</div>
          </div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="font-bold text-slate-900 dark:text-white">Bugünün Programı</h2>
        </div>

        {sortedActivities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-900 mb-4">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Bugün program yok</h3>
            <p className="text-slate-500 text-sm">
              Bugün için planlanmış ilaç bulunmuyor
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {sortedActivities.map((activity, index) => (
              <div 
                key={`${activity.type}-${activity.id}-${index}`} 
                className={`p-5 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-700/30 ${getStatusStyles(activity.status)} border-l-4`}
                style={{ borderLeftColor: activity.status === 'completed' ? '#10b981' : activity.status === 'missed' ? '#e11d48' : '#3b82f6' }}
              >
                
                <div className="flex items-start gap-5">
                  
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
                      {activity.time}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activity.title}</h3>
                          {getStatusIcon(activity.status)}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-1.5">
                          <Pill className="w-4 h-4" />
                          {activity.subtitle}
                        </p>
                      </div>
                      
                      {activity.status === 'pending' && (
                        <button 
                          onClick={() => setSelectedMedication(activity.data)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5 active:scale-95"
                        >
                          İşlem Yap
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medication Action Modal */}
      {selectedMedication && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">İlaç Durumunu Güncelle</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedMedication.medication.name} - {selectedMedication.scheduledTime}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMedication(null)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={medicationNotes}
              onChange={(e) => setMedicationNotes(e.target.value)}
              placeholder="Not ekleyin (isteğe bağlı)..."
              className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
            />

            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleMedicationAction('skipped')}
                className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Atla
              </button>
              <button 
                onClick={() => handleMedicationAction('missed')}
                className="px-4 py-3 rounded-xl text-sm font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors"
              >
                Kaçırıldı
              </button>
              <button 
                onClick={() => handleMedicationAction('taken')}
                className="px-4 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-colors"
              >
                Alındı
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
