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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'missed':
        return <X className="w-5 h-5 text-red-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'theme-border theme-bg-secondary border border-green-200';
      case 'missed':
        return 'theme-border theme-bg-secondary border border-red-200';
      case 'overdue':
        return 'theme-border theme-bg-secondary border border-orange-200';
      default:
        return 'theme-border theme-surface';
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
      
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 theme-primary text-white p-1 rounded" />
          <div>
            <h1 className="text-lg font-semibold theme-text">Günlük Program</h1>
            <p className="theme-text-muted text-sm">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 theme-bg-secondary rounded-lg">
            <div className="text-2xl font-bold theme-text">{stats.total}</div>
            <div className="text-sm theme-text-muted">Toplam</div>
          </div>
          <div className="text-center p-3 theme-bg-secondary rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm theme-text">Tamamlandı</div>
          </div>
          <div className="text-center p-3 theme-bg-secondary rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm theme-text">Bekliyor</div>
          </div>
          <div className="text-center p-3 theme-bg-secondary rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.missed}</div>
            <div className="text-sm theme-text">Kaçırılan</div>
          </div>
        </div>
      </div>

      <div className="theme-surface rounded-lg shadow-sm border theme-border">
        <div className="p-4 border-b theme-border">
          <h2 className="theme-text font-semibold">Bugünün Programı</h2>
        </div>

        {sortedActivities.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 theme-text-muted mx-auto mb-3" />
            <h3 className="theme-text text-lg font-medium mb-2">Bugün program yok</h3>
            <p className="theme-text-muted text-sm">
              Bugün için planlanmış ilaç bulunmuyor
            </p>
          </div>
        ) : (
          <div className="divide-y theme-border">
            {sortedActivities.map((activity, index) => (
              <div key={`${activity.type}-${activity.id}-${index}`} className={`p-4 ${getStatusColor(activity.status)}`}>
                
                <div className="flex items-start gap-4">
                  
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full theme-surface border-2 theme-border">
                      <Pill className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-xs theme-text-muted mt-1 font-mono">
                      {activity.time}
                    </div>
                    {index < sortedActivities.length - 1 && (
                      <div className="w-px h-8 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="theme-text font-medium">{activity.title}</h3>
                          {getStatusIcon(activity.status)}
                        </div>
                        <p className="theme-text-muted text-sm">{activity.subtitle}</p>
                      </div>
                      
                      {activity.status === 'pending' && (
                        <button 
                          onClick={() => setSelectedMedication(activity.data)}
                          className="text-sm font-semibold text-blue-600 hover:underline"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="theme-surface rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold theme-text">İlaç Durumunu Güncelle</h3>
                <p className="text-sm theme-text-muted">
                  {selectedMedication.medication.name} - {selectedMedication.scheduledTime}
                </p>
              </div>
              <button onClick={() => setSelectedMedication(null)} className="theme-text-muted hover:theme-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={medicationNotes}
              onChange={(e) => setMedicationNotes(e.target.value)}
              placeholder="Not ekleyin (isteğe bağlı)"
              className="w-full p-2 border theme-border rounded-md mb-4 theme-bg-secondary theme-text"
              rows={3}
            />

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => handleMedicationAction('skipped')}
                className="px-4 py-2 rounded-md text-sm font-medium theme-bg-secondary theme-text hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Atla
              </button>
              <button 
                onClick={() => handleMedicationAction('missed')}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                Kaçırıldı
              </button>
              <button 
                onClick={() => handleMedicationAction('taken')}
                className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
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