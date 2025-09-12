import React, { useState } from 'react';
import { Check } from '../types';
import { formatDate, getDaysUntilPayment } from '../utils/dateUtils';
import { Edit2, Trash2, CheckCircle, Circle, Calendar, User, Banknote, Search, CreditCard, Receipt, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';

interface CheckListProps {
  checks: Check[];
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

export default function CheckList({ checks, onEdit, onDelete, onTogglePaid }: CheckListProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('closest'); // New state for sorting

  // Zaman filtresi seçenekleri
  const timeFilterOptions = [
    { id: 'all', label: 'Tüm Zamanlar' },
    { id: 'today', label: 'Bugün' },
    { id: 'thisWeek', label: 'Bu Hafta' },
    { id: 'thisMonth', label: 'Bu Ay' },
    { id: 'thisYear', label: 'Bu Yıl' },
  ];

  // Sıralama seçenekleri
  const sortOptions = [
    { id: 'closest', label: 'En Yakın Ödeme', icon: TrendingUp },
    { id: 'farthest', label: 'En Uzak Ödeme', icon: TrendingDown },
    { id: 'lowest', label: 'En Az Ödeme', icon: ArrowDown },
    { id: 'highest', label: 'En Çok Ödeme', icon: ArrowUp },
  ];

  // Filtreleme fonksiyonu
  const getFilteredChecks = () => {
    return checks.filter(check => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        check.createdBy.toLowerCase().includes(searchLower) ||
        check.signedTo.toLowerCase().includes(searchLower) ||
        check.amount.toString().includes(searchLower);

      if (!matchesSearch) return false;

      const now = new Date();
      const checkDate = check.isRecurring && check.nextPaymentDate 
        ? new Date(check.nextPaymentDate) 
        : new Date(check.paymentDate);

      switch (timeFilter) {
        case 'today':
          return checkDate.toDateString() === now.toDateString();
        case 'thisWeek':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() + 1);
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          return checkDate >= startOfWeek && checkDate <= endOfWeek;
        case 'thisMonth':
          return checkDate.getMonth() === now.getMonth() && checkDate.getFullYear() === now.getFullYear();
        case 'thisYear':
          return checkDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  // Filtrelenmiş çekleri al
  const filteredChecks = getFilteredChecks();

  // İstatistikleri hesapla
  const getStats = () => {
    const now = Date.now();
    const unpaidChecks = filteredChecks.filter(c => !c.isPaid);
    const paidChecks = filteredChecks.filter(c => c.isPaid);
    const overdueChecks = unpaidChecks.filter(c => {
      const daysUntil = getDaysUntilPayment(c.paymentDate, c.nextPaymentDate, c.isRecurring);
      return daysUntil < 0;
    });

    // En yakın ödeme
    const closestPayment = unpaidChecks.length > 0 
      ? [...unpaidChecks].sort((a, b) => {
          const getDateForSorting = (check: Check) => {
            if (check.isRecurring && check.nextPaymentDate) {
              return new Date(check.nextPaymentDate).getTime();
            }
            return new Date(check.paymentDate).getTime();
          };
          
          const dateA = getDateForSorting(a);
          const dateB = getDateForSorting(b);
          return Math.abs(dateA - now) - Math.abs(dateB - now);
        })[0]
      : null;

    // En uzak ödeme
    const farthestPayment = unpaidChecks.length > 0 
      ? [...unpaidChecks].sort((a, b) => {
          const getDateForSorting = (check: Check) => {
            if (check.isRecurring && check.nextPaymentDate) {
              return new Date(check.nextPaymentDate).getTime();
            }
            return new Date(check.paymentDate).getTime();
          };
          
          const dateA = getDateForSorting(a);
          const dateB = getDateForSorting(b);
          return Math.abs(dateB - now) - Math.abs(dateA - now);
        })[0]
      : null;

    return {
      totalUnpaidAmount: unpaidChecks.reduce((sum, c) => sum + (c.amount || 0), 0),
      totalPaidAmount: paidChecks.reduce((sum, c) => sum + (c.amount || 0), 0),
      totalOverdueAmount: overdueChecks.reduce((sum, c) => sum + (c.amount || 0), 0),
      closestPayment,
      farthestPayment,
      lowestPayment: filteredChecks.length > 0 ? [...filteredChecks].sort((a, b) => a.amount - b.amount)[0] : null,
      highestPayment: filteredChecks.length > 0 ? [...filteredChecks].sort((a, b) => b.amount - a.amount)[0] : null,
    };
  };

  const stats = getStats();

  // Sıralama fonksiyonu
  const getSortedChecks = () => {
    const sorted = [...filteredChecks].sort((a, b) => {
      const getDateForSorting = (check: Check) => {
        if (check.isRecurring && check.nextPaymentDate) {
          return new Date(check.nextPaymentDate).getTime();
        }
        return new Date(check.paymentDate).getTime();
      };
      
      switch (sortOption) {
        case 'closest':
          // En yakın tarihe göre sırala
          return Math.abs(getDateForSorting(a) - Date.now()) - Math.abs(getDateForSorting(b) - Date.now());
        case 'farthest':
          // En uzak tarihe göre sırala
          return Math.abs(getDateForSorting(b) - Date.now()) - Math.abs(getDateForSorting(a) - Date.now());
        case 'lowest':
          // En düşük miktara göre sırala
          return a.amount - b.amount;
        case 'highest':
          // En yüksek miktara göre sırala
          return b.amount - a.amount;
        default:
          // Varsayılan olarak tarihe göre sırala
          return getDateForSorting(a) - getDateForSorting(b);
      }
    });
    
    return sorted;
  };

  const sortedChecks = getSortedChecks();

  return (
    <div className="space-y-6">
      {/* Time Filters - En Üstteki Büyük Kareler */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {timeFilterOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setTimeFilter(option.id)}
            className={`p-4 rounded-xl text-base font-semibold transition-all text-center shadow-sm ${
              timeFilter === option.id
                ? 'theme-primary text-white shadow-md transform scale-105'
                : 'theme-surface theme-border theme-text hover:theme-bg-secondary border'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Stats Grid - Orta Bölüm */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Sol - Toplam İstatistikler (3/5 oranında) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalUnpaidAmount.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">Ödenecek</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalPaidAmount.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 mt-1">Ödenen</div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.totalOverdueAmount.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-sm text-red-700 dark:text-red-300 mt-1">Geciken</div>
          </div>
          
          {/* Search - İstatistiklerin altına taşındı */}
          <div className="sm:col-span-3 relative mt-3">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 theme-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Kişi adı, firma adı veya tutar ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="theme-input w-full pl-12 pr-12 py-3 rounded-lg"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center theme-text-muted hover:theme-text text-xl font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Sağ - Sıralama Seçenekleri (2/5 oranında) */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {sortOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setSortOption(option.id)}
                className={`theme-surface rounded-xl p-4 border theme-border text-left transition-all ${
                  sortOption === option.id
                    ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm font-medium theme-text">{option.label}</span>
                </div>
                <div className="text-xs theme-text-muted">
                  {option.id === 'closest' && stats.closestPayment ? `${stats.closestPayment.amount.toLocaleString('tr-TR')} ₺` : 
                   option.id === 'farthest' && stats.farthestPayment ? `${stats.farthestPayment.amount.toLocaleString('tr-TR')} ₺` :
                   option.id === 'lowest' && stats.lowestPayment ? `${stats.lowestPayment.amount.toLocaleString('tr-TR')} ₺` :
                   option.id === 'highest' && stats.highestPayment ? `${stats.highestPayment.amount.toLocaleString('tr-TR')} ₺` : '-'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment List */}
      <div className="theme-surface rounded-lg shadow-sm p-6 border theme-border">
        <h2 className="text-lg font-semibold theme-text mb-4">Ödemeler</h2>
        
        {sortedChecks.length > 0 ? (
          <div className="space-y-4">
            {sortedChecks.map(check => {
              const daysUntil = getDaysUntilPayment(check.paymentDate, check.nextPaymentDate, check.isRecurring);
              const isOverdue = !check.isPaid && daysUntil < 0;
              const isToday = daysUntil === 0;
              
              const displayDate = (check.isRecurring && check.nextPaymentDate) 
                ? check.nextPaymentDate 
                : check.paymentDate;
              
              return (
                <div 
                  key={check.id} 
                  className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                    check.isPaid 
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/10' 
                      : isOverdue 
                        ? 'border-red-200 bg-red-50 dark:bg-red-900/10' 
                        : isToday
                          ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10'
                          : 'theme-border theme-bg'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    
                    {/* Left Side */}
                    <div className="flex items-center gap-4 flex-1">
                      
                      {/* Status Toggle */}
                      <button
                        onClick={() => onTogglePaid(check.id)}
                        className={`p-2 rounded-full transition-all ${
                          check.isPaid 
                            ? 'text-green-600 hover:text-green-700 bg-green-100 dark:bg-green-900/20' 
                            : 'theme-text-muted hover:theme-text bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        {check.isPaid ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>
                      
                      {/* Type Icon */}
                      <div className={`p-3 rounded-lg ${
                        check.type === 'check' ? 'bg-purple-100 dark:bg-purple-900/20' : 'bg-orange-100 dark:bg-orange-900/20'
                      }`}>
                        {check.type === 'check' ? (
                          <CreditCard className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Receipt className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="theme-text font-semibold text-base truncate">
                            {check.signedTo}
                          </span>
                          {check.isRecurring && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              🔄 Tekrarlayan
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm theme-text-muted">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {check.createdBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(displayDate)}
                          </span>
                          {!check.isPaid && (
                            <span className={`font-medium ${
                              isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-blue-600'
                            }`}>
                              {daysUntil === 0 
                                ? 'Bugün ödenecek' 
                                : daysUntil > 0 
                                  ? `${daysUntil} gün kaldı`
                                  : `${Math.abs(daysUntil)} gün geçti`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                      
                      {/* Amount */}
                      <div className="text-right">
                        <div className="text-xl font-bold theme-text">
                          {check.amount.toLocaleString('tr-TR')} ₺
                        </div>
                        {check.type === 'bill' && check.billType && (
                          <div className="text-xs theme-text-muted capitalize">
                            {check.billType === 'diger' ? check.customBillType : check.billType}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(check)}
                          className="p-2 theme-text-muted hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Düzenle"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(check.id)}
                          className="p-2 theme-text-muted hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* No Results */
          <div className="text-center py-12">
            <div className="w-16 h-16 theme-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Banknote className="h-8 w-8 theme-text-muted" />
            </div>
            {checks.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold theme-text mb-2">Arama sonucu bulunamadı</h3>
                <p className="theme-text-muted">
                  "{searchTerm}" aramanız için uygun ödeme bulunamadı.<br/>
                  Farklı anahtar kelimeler deneyin veya filtreleri değiştirin.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold theme-text mb-2">Henüz ödeme eklenmemiş</h3>
                <p className="theme-text-muted mb-4">
                  İlk çek veya faturanızı ekleyerek başlayın.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}