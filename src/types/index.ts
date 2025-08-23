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

export type ThemeType = 
  | 'light'      // 🌅 Açık Tema
  | 'dark'       // 🌙 Koyu Tema
  | 'blue'       // 🔵 Mavi Tema
  | 'green'      // 🟢 Yeşil Tema
  | 'orange'     // 🟠 Turuncu Tema
  | 'purple'     // 🟣 Mor Tema
  | 'gray'       // ⚫ Gri Tema
  | 'red'        // 🔴 Kırmızı Tema
  | 'teal'       // 🟦 Turkuaz Tema
  | 'pink';      // 🌸 Pembe Tema

export interface Settings {
  reminderDays: number;
  notificationsEnabled: boolean;
  autoUpdateEnabled: boolean;
  dailyNotificationEnabled: boolean;
  dailyNotificationTime: string;
  lastNotificationCheck: string;
  telegramBotEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  theme: ThemeType; // 🎨 Yeni tema seçeneği
  // 💊 Hap sistemi ayarları
  medicationNotificationsEnabled: boolean;
  medicationReminderMinutes: number; // Kaç dakika önce hatırlatsın
  showMedicationsInDashboard: boolean;
  medicationSoundEnabled: boolean;
}

// Bildirim geçmişi için yeni interface
export interface NotificationHistory {
  checkId: string;
  notificationType: 'reminder' | 'due-today' | 'daily' | 'medication'; // Hap bildirimi eklendi
  sentAt: string; // ISO string
  paymentDate: string; // Hangi ödeme tarihi için gönderildi
  medicationId?: string; // Hap bildirimi için
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  type?: 'payment' | 'medication'; // Bildirim türü
}

// Hap sistemi export'ları
export * from './medication';