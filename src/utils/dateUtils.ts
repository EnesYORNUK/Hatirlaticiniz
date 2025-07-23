export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('tr-TR');
}

export function getDaysUntilPayment(paymentDate: string): number {
  // Timezone problemlerini önlemek için sadece tarih kısmını kullan
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Günün başına ayarla
  
  const payment = new Date(paymentDate);
  payment.setHours(0, 0, 0, 0); // Günün başına ayarla
  
  const diffTime = payment.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getPaymentStatus(paymentDate: string, isPaid: boolean): 'paid' | 'overdue' | 'upcoming' | 'today' {
  if (isPaid) return 'paid';
  
  const daysUntil = getDaysUntilPayment(paymentDate);
  
  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'today';
  return 'upcoming';
}

// Yeni eklenen utility fonksiyonlar
export function isToday(date: string): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  
  return today.getFullYear() === checkDate.getFullYear() &&
         today.getMonth() === checkDate.getMonth() &&
         today.getDate() === checkDate.getDate();
}

export function isDateInRange(date: string, daysBefore: number): boolean {
  const daysUntil = getDaysUntilPayment(date);
  return daysUntil === daysBefore;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid': return 'text-green-600 bg-green-50';
    case 'overdue': return 'text-red-600 bg-red-50';
    case 'today': return 'text-orange-600 bg-orange-50';
    case 'upcoming': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'paid': return 'Ödendi';
    case 'overdue': return 'Vadesi Geçti';
    case 'today': return 'Bugün Ödenmeli';
    case 'upcoming': return 'Beklemede';
    default: return 'Bilinmiyor';
  }
}