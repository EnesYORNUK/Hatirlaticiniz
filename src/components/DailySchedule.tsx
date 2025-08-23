import React, { useState, useMemo } from 'react';
import { DailyMedicationSchedule } from '../types/medication';
import { Check } from '../types';
import { 
  Pill, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X,
  RotateCcw,
  Calendar,
  User
} from 'lucide-react';

interface DailyScheduleProps {
  medicationSchedule: DailyMedicationSchedule;
  todayPayments: Check[];
  onMarkMedicationTaken: (medicationId: string, status: 'taken' | 'missed' | 'skipped', notes?: string) => void;
  onMarkPaymentPaid: (paymentId: string) => void;
}

export default function DailySchedule({ 
  medicationSchedule, 
  todayPayments, 
  onMarkMedicationTaken,
  onMarkPaymentPaid 
}: DailyScheduleProps) {
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  const [medicationNotes, setMedicationNotes] = useState('');

  // Tüm etkinlikleri zamana göre sırala
  const sortedActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'medication' | 'payment';
      time: string;
      title: string;
      subtitle: string;
      status: 'pending' | 'completed' | 'missed' | 'overdue';
      amount?: number;
      data: any;
    }> = [];

    // İlaçları ekle
    medicationSchedule.medications.forEach(item => {
      activities.push({
        id: item.medication.id,
        type: 'medication',
        time: item.scheduledTime,
        title: item.medication.name,
        subtitle: `${item.medication.dosage} - ${item.medication.createdBy}`,
        status: item.status === 'taken' ? 'completed' : 
                item.status === 'missed' ? 'missed' : 'pending',
        data: item
      });
    });

    // Ödemeleri ekle
    todayPayments.forEach(payment => {
      const paymentTime = payment.isRecurring && payment.nextPaymentDate 
        ? new Date(payment.nextPaymentDate) 
        : new Date(payment.paymentDate);
      
      const now = new Date();
      const isOverdue = paymentTime < now && !payment.isPaid;

      activities.push({
        id: payment.id,
        type: 'payment',
        time: '23:59', // Ödemeler için gün sonu
        title: payment.signedTo,
        subtitle: `${payment.type === 'bill' ? 'Fatura' : 'Çek'} - ${payment.createdBy}`,
        status: payment.isPaid ? 'completed' : isOverdue ? 'overdue' : 'pending',
        amount: payment.amount,
        data: payment
      });
    });

    // Zamana göre sırala
    return activities.sort((a, b) => a.time.localeCompare(b.time));
  }, [medicationSchedule, todayPayments]);

  const handleMedicationAction = (medicationId: string, status: 'taken' | 'missed' | 'skipped') => {
    onMarkMedicationTaken(medicationId, status, medicationNotes.trim() || undefined);
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
        return 'border-green-200 bg-green-50';
      case 'missed':
        return 'border-red-200 bg-red-50';
      case 'overdue':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-white';
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
      
      {/* Header */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 theme-primary text-white p-1 rounded" />
          <div>
            <h1 className="text-lg font-semibold theme-text">Günlük Program</h1>
            <p className="theme-text-muted text-sm">
              {formatDate(medicationSchedule.date)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 theme-bg-secondary rounded-lg">
            <div className="text-2xl font-bold theme-text">{stats.total}</div>
            <div className="text-sm theme-text-muted">Toplam</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-700">Tamamlandı</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-blue-700">Bekliyor</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.missed}</div>
            <div className="text-sm text-red-700">Kaçırılan</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border">
        <div className="p-4 border-b theme-border">
          <h2 className="theme-text font-semibold">Bugünün Programı</h2>
        </div>

        {sortedActivities.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 theme-text-muted mx-auto mb-3" />
            <h3 className="theme-text text-lg font-medium mb-2">Bugün program yok</h3>
            <p className="theme-text-muted text-sm">
              Bugün için planlanmış ilaç veya ödeme bulunmuyor
            </p>
          </div>
        ) : (
          <div className="divide-y theme-border">
            {sortedActivities.map((activity, index) => (
              <div key={`${activity.type}-${activity.id}`} className={`p-4 ${getStatusColor(activity.status)}`}>
                
                <div className="flex items-start gap-4">
                  
                  {/* Icon & Time */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 theme-border">
                      {activity.type === 'medication' ? (
                        <Pill className="w-5 h-5 text-blue-600" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="text-xs theme-text-muted mt-1 font-mono">
                      {activity.time}
                    </div>
                    {index < sortedActivities.length - 1 && (
                      <div className="w-px h-8 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="theme-text font-medium">{activity.title}</h3>
                          {getStatusIcon(activity.status)}
                        </div>
                        <p className="theme-text-muted text-sm">{activity.subtitle}</p>
                        {activity.amount && (
                          <p className="theme-text text-sm font-medium mt-1">
                            {activity.amount.toLocaleString('tr-TR')} TL
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {activity.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          {activity.type === 'medication' ? (
                            <>
                              <button
                                onClick={() => setSelectedMedication(selectedMedication === activity.id ? null : activity.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              >
                                İşaretle
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onMarkPaymentPaid(activity.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Ödendi
                            </button>
                          )}
                        </div>
                      )}

                      {/* Reset completed medication */}
                      {activity.type === 'medication' && activity.status !== 'pending' && (
                        <button
                          onClick={() => {
                            // Reset by marking as skipped then removing the log entry
                            const medicationItem = activity.data;
                            if (medicationItem.log) {
                              // This will effectively reset it by creating a new entry that overwrites the old one
                              window.location.reload(); // Temporary solution - in production you'd want a proper reset function
                            }
                          }}
                          className="p-1 theme-text-muted hover:theme-text transition-colors"
                          title="Sıfırla"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Medication Action Panel */}
                    {selectedMedication === activity.id && activity.type === 'medication' && (
                      <div className="mt-3 p-3 bg-white rounded-lg border theme-border space-y-3">
                        
                        <div>
                          <label className="theme-text text-sm font-medium block mb-1">
                            Not (İsteğe bağlı)
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: Yemekten sonra alındı"
                            value={medicationNotes}
                            onChange={(e) => setMedicationNotes(e.target.value)}
                            className="theme-input w-full text-sm"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMedicationAction(activity.id, 'taken')}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            İçtim
                          </button>
                          <button
                            onClick={() => handleMedicationAction(activity.id, 'skipped')}
                            className="px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Atladım
                          </button>
                          <button
                            onClick={() => handleMedicationAction(activity.id, 'missed')}
                            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Kaçırdım
                          </button>
                        </div>

                        <button
                          onClick={() => setSelectedMedication(null)}
                          className="w-full px-3 py-1 theme-button-secondary text-sm"
                        >
                          İptal
                        </button>
                      </div>
                    )}

                    {/* Show medication log info if exists */}
                    {activity.type === 'medication' && activity.data.log && (
                      <div className="mt-2 text-xs theme-text-muted">
                        {activity.data.log.status === 'taken' && '✅ İçildi'}
                        {activity.data.log.status === 'skipped' && '⏭️ Atlandı'}
                        {activity.data.log.status === 'missed' && '❌ Kaçırıldı'}
                        {activity.data.log.notes && ` - ${activity.data.log.notes}`}
                        <div className="mt-1">
                          {new Date(activity.data.log.takenAt).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}