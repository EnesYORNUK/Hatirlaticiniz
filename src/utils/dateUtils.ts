export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Mobil ve küçük alanlar için kompakt currency formatı
export function formatCurrencyCompact(amount: number): string {
  // 1 milyon ve üzeri için compact notation kullan
  if (Math.abs(amount) >= 1000000) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  }
  
  // Normal formatting
  return formatCurrency(amount);
}

// Responsive currency formatter - ekran boyutuna göre format seçer
export function formatCurrencyResponsive(amount: number, isSmallScreen: boolean = false): string {
  if (isSmallScreen && Math.abs(amount) >= 100000) {
    return formatCurrencyCompact(amount);
  }
  return formatCurrency(amount);
}

export function getDaysUntilPayment(paymentDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Saat dilimi sorunlarını önlemek için

  const payment = new Date(paymentDate);
  payment.setHours(0, 0, 0, 0);

  const diffTime = payment.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getPaymentStatus(paymentDate: string, isPaid: boolean): string {
  if (isPaid) {
    return 'Ödendi';
  }

  const daysUntil = getDaysUntilPayment(paymentDate);
  
  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} gün geçti`;
  } else if (daysUntil === 0) {
    return 'Bugün ödenecek';
  } else if (daysUntil <= 3) {
    return `${daysUntil} gün kaldı`;
  } else if (daysUntil <= 7) {
    return `${daysUntil} gün kaldı`;
  } else {
    return `${daysUntil} gün kaldı`;
  }
}

export function isToday(dateString: string): boolean {
  const today = new Date();
  const date = new Date(dateString);
  
  return today.toDateString() === date.toDateString();
}

export function isDateInRange(dateString: string, startDate: string, endDate: string): boolean {
  const date = new Date(dateString);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return date >= start && date <= end;
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