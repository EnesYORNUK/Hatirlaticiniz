export interface Check {
  id: string;
  createdDate: string;
  paymentDate: string;
  amount: number;
  createdBy: string;
  signedTo: string;
  isPaid: boolean;
  createdAt: string;
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