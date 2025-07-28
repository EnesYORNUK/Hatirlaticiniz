export interface Check {
  id: string;
  createdDate: string;
  paymentDate: string;
  amount: number;
  createdBy: string;
  signedTo: string; // Bu "Ödenecek Firma/Kişi" olacak UI'da
  isPaid: boolean;
  createdAt: string;
  // Yeni özellikler
  type: 'check' | 'bill'; // Çek mi fatura mı
  billType?: 'elektrik' | 'su' | 'dogalgaz' | 'telefon' | 'internet' | 'diger'; // Fatura türü
  customBillType?: string; // Özel fatura türü (kullanıcı girer)
  isRecurring: boolean; // Tekrarlayan mı
  recurringType?: 'monthly' | 'weekly' | 'yearly'; // Tekrar türü
  recurringDay?: number; // Hangi gün tekrarlanacak (1-31 ay için, 1-7 hafta için)
  nextPaymentDate?: string; // Bir sonraki ödeme tarihi (tekrarlayan için)
}

export interface Settings {
  reminderDays: number;
  notificationsEnabled: boolean;
  autoUpdateEnabled: boolean;
  // Yeni bildirim ayarları
  dailyNotificationEnabled: boolean; // Günlük bildirim açık/kapalı
  dailyNotificationTime: string; // "09:00" formatında
  lastNotificationCheck: string; // Son bildirim kontrolü tarihi
}

// Bildirim geçmişi için yeni interface
export interface NotificationHistory {
  checkId: string;
  notificationType: 'reminder' | 'due-today' | 'daily';
  sentAt: string; // ISO string
  paymentDate: string; // Hangi ödeme tarihi için gönderildi
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
}