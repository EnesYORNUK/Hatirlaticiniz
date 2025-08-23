// Hap takip sistemi için type definitions

export interface Medication {
  id: string;
  name: string; // Hap adı
  dosage: string; // Doz bilgisi (örn: "1 tablet", "5ml")
  frequency: 'daily' | 'weekly' | 'monthly'; // Sıklık
  time: string; // Saat (HH:MM formatında)
  weekDay?: number; // Haftalık için hangi gün (1=Pazartesi, 7=Pazar)
  monthDay?: number; // Aylık için hangi gün (1-31)
  isActive: boolean; // Aktif mi?
  startDate: string; // Başlangıç tarihi
  endDate?: string; // Bitiş tarihi (opsiyonel)
  notes?: string; // Notlar
  createdAt: string;
  createdBy: string; // Kim oluşturdu
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: string; // İçildiği tarih-saat
  scheduledTime: string; // Planlandığı saat
  status: 'taken' | 'missed' | 'skipped'; // Durumu
  notes?: string; // Notlar
  createdAt: string;
}

export interface DailyMedicationSchedule {
  date: string; // YYYY-MM-DD formatında
  medications: {
    medication: Medication;
    scheduledTime: string;
    log?: MedicationLog;
    status: 'pending' | 'taken' | 'missed' | 'skipped';
  }[];
}

export interface MedicationStats {
  totalMedications: number;
  activeMedications: number;
  todayCount: number;
  takenToday: number;
  missedToday: number;
  weeklyCompliance: number; // Bu hafta uyum yüzdesi
  monthlyCompliance: number; // Bu ay uyum yüzdesi
}

// Yeni notification türü
export interface MedicationNotification {
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  type: 'reminder' | 'missed';
}

// Widget'lar için
export type MedicationWidgetType = 
  | 'today-medications' 
  | 'weekly-schedule' 
  | 'compliance-stats' 
  | 'upcoming-medications' 
  | 'medication-history';

export interface MedicationReminder {
  medicationId: string;
  reminderTime: string; // Kaç dakika önce hatırlatsın
  isEnabled: boolean;
}