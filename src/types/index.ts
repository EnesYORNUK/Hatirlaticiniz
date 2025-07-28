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
}

export interface NotificationData {
  checkId: string;
  title: string;
  message: string;
  type: 'warning' | 'urgent';
}