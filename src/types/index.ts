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
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Tekrar türü (günlük eklendi)
  recurringDay?: number; // Tek gün seçimi (geri uyumluluk)
  recurringDays?: number[]; // Haftalık için birden fazla gün seçimi (1-7)
  nextPaymentDate?: string; // Bir sonraki ödeme tarihi (tekrarlayan için)
  // Opsiyonel bitiş koşulları
  recurringEndCount?: number; // Kaç kez tekrarlanacağı
  recurringEndMonths?: number; // Kaç ay sonra biteceği
  recurringEndDate?: string; // Belirli bir tarihten sonra biteceği (ISO)
}

export type ThemeType = 
  | 'light'      // 🌅 Açık Tema
  | 'dark';      // 🌙 Koyu Tema

export interface Settings {
  reminderDays: number;
  notificationsEnabled: boolean;
  autoUpdateEnabled: boolean;
  dailyNotificationEnabled: boolean;
  dailyNotificationTime: string;
  lastNotificationCheck: string;
  autoDeleteAfterDays?: number;
  telegramBotEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  launchOnStartup?: boolean;
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

// Authentication interfaces
export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

// Hap sistemi export'ları
export * from './medication';