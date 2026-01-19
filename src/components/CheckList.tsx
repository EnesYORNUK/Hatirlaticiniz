import { useState } from 'react';
import { Check } from '../types';
import { formatDate, getDaysUntilPayment } from '../utils/dateUtils';
import { formatCurrency } from '../utils/accountUtils';
import { 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Calendar, 
  Search, 
  CreditCard, 
  Receipt, 
  AlertCircle,
  Clock
} from 'lucide-react';

interface CheckListProps {
  checks: Check[];
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

export default function CheckList({ checks, onEdit, onDelete, onTogglePaid }: CheckListProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('closest');
  const [statusFilter, setStatusFilter] = useState<'unpaid' | 'paid' | 'overdue' | null>(null);

  // Filter toggle
  const toggleStatusFilter = (filter: 'unpaid' | 'paid' | 'overdue') => {
    setStatusFilter(prev => (prev === filter ? null : filter));
  };

  // Filter logic
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

      let timeMatches = true;
      switch (timeFilter) {
        case 'today':
          timeMatches = checkDate.toDateString() === now.toDateString();
          break;
        case 'thisWeek':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() + 1);
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          timeMatches = checkDate >= startOfWeek && checkDate <= endOfWeek;
          break;
        case 'thisMonth':
          timeMatches = checkDate.getMonth() === now.getMonth() && checkDate.getFullYear() === now.getFullYear();
          break;
        case 'thisYear':
          timeMatches = checkDate.getFullYear() === now.getFullYear();
          break;
        default:
          timeMatches = true;
      }

      if (!timeMatches) return false;

      const daysUntil = getDaysUntilPayment(check.paymentDate, check.nextPaymentDate, check.isRecurring);
      const isOverdue = !check.isPaid && daysUntil < 0;

      const statusMatches = !statusFilter ||
        (statusFilter === 'unpaid' && !check.isPaid && !isOverdue) ||
        (statusFilter === 'paid' && check.isPaid) ||
        (statusFilter === 'overdue' && isOverdue);

      return statusMatches;
    });
  };

  const filteredChecks = getFilteredChecks();

  // Sorting logic
  const getSortedChecks = () => {
    return [...filteredChecks].sort((a, b) => {
      const getDateForSorting = (check: Check) => {
        if (check.isRecurring && check.nextPaymentDate) {
          return new Date(check.nextPaymentDate).getTime();
        }
        return new Date(check.paymentDate).getTime();
      };
      
      switch (sortOption) {
        case 'closest':
          return Math.abs(getDateForSorting(a) - Date.now()) - Math.abs(getDateForSorting(b) - Date.now());
        case 'farthest':
          return Math.abs(getDateForSorting(b) - Date.now()) - Math.abs(getDateForSorting(a) - Date.now());
        case 'lowest':
          return a.amount - b.amount;
        case 'highest':
          return b.amount - a.amount;
        default:
          return getDateForSorting(a) - getDateForSorting(b);
      }
    });
  };

  const sortedChecks = getSortedChecks();

  // Calculate stats for top cards
  const stats = {
    unpaid: checks.filter(c => !c.isPaid && getDaysUntilPayment(c.paymentDate, c.nextPaymentDate, c.isRecurring) >= 0).reduce((sum, c) => sum + Number(c.amount), 0),
    paid: checks.filter(c => c.isPaid).reduce((sum, c) => sum + Number(c.amount), 0),
    overdue: checks.filter(c => !c.isPaid && getDaysUntilPayment(c.paymentDate, c.nextPaymentDate, c.isRecurring) < 0).reduce((sum, c) => sum + Number(c.amount), 0),
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Controls Container - Compact */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 max-w-4xl mx-auto">
        
        {/* Status Filters (Ödenecek / Ödenen / Geciken) */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => toggleStatusFilter('unpaid')}
            className={`flex-1 min-w-[140px] flex items-center justify-between p-2.5 rounded-xl transition-all ${
              statusFilter === 'unpaid' 
                ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${statusFilter === 'unpaid' ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ödenecek</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(stats.unpaid)}</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => toggleStatusFilter('paid')}
            className={`flex-1 min-w-[140px] flex items-center justify-between p-2.5 rounded-xl transition-all ${
              statusFilter === 'paid' 
                ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-500 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${statusFilter === 'paid' ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'}`}>
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ödenen</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(stats.paid)}</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => toggleStatusFilter('overdue')}
            className={`flex-1 min-w-[140px] flex items-center justify-between p-2.5 rounded-xl transition-all ${
              statusFilter === 'overdue' 
                ? 'bg-rose-100 dark:bg-rose-900/40 ring-2 ring-rose-500 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${statusFilter === 'overdue' ? 'bg-rose-200 dark:bg-rose-800 text-rose-700 dark:text-rose-300' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'}`}>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Geciken</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(stats.overdue)}</div>
              </div>
            </div>
          </button>
        </div>

        {/* Time Filters (Buttons) */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'today', label: 'Bugün' },
            { id: 'thisWeek', label: 'Bu Hafta' },
            { id: 'thisMonth', label: 'Bu Ay' },
            { id: 'thisYear', label: 'Bu Yıl' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="İsim veya tutar ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex gap-2">
           <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="closest">En Yakın</option>
            <option value="farthest">En Uzak</option>
            <option value="lowest">En Düşük Tutar</option>
            <option value="highest">En Yüksek Tutar</option>
          </select>
        </div>
      </div>

      {/* Check Grid */}
      {sortedChecks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-900 mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Sonuç Bulunamadı</h3>
          <p className="text-slate-500">Arama kriterlerinize uygun kayıt bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedChecks.map((check) => {
            const daysUntil = getDaysUntilPayment(check.paymentDate, check.nextPaymentDate, check.isRecurring);
            const isOverdue = !check.isPaid && daysUntil < 0;
            const isToday = daysUntil === 0;
            const displayDate = check.isRecurring && check.nextPaymentDate ? check.nextPaymentDate : check.paymentDate;

            // Determine card styles based on status
            let cardStyles = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"; // Default
            let statusBadgeStyles = "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

            if (check.isPaid) {
              cardStyles = "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50";
              statusBadgeStyles = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            } else if (isOverdue) {
              cardStyles = "bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50";
              statusBadgeStyles = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
            } else {
              // Unpaid and not overdue (Pending)
               cardStyles = "bg-blue-50/30 dark:bg-blue-900/5 border-blue-100 dark:border-blue-800/30";
               statusBadgeStyles = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            }

            return (
              <div
                key={check.id}
                className={`group relative rounded-2xl border transition-all duration-300 hover:shadow-md ${cardStyles}`}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shadow-sm ${
                        check.type === 'check' 
                          ? 'bg-white text-purple-600 dark:bg-slate-800 dark:text-purple-400'
                          : 'bg-white text-orange-600 dark:bg-slate-800 dark:text-orange-400'
                      }`}>
                        {check.type === 'check' ? <CreditCard className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold opacity-70 uppercase tracking-wider mb-0.5">
                          {check.type === 'check' ? 'Çek' : 'Fatura'}
                        </div>
                        <div className="font-bold text-lg leading-none truncate max-w-[140px]">
                          {check.signedTo}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(check)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(check.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-black tracking-tight mb-2">
                      {formatCurrency(check.amount)}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                        <Calendar className="w-4 h-4" />
                        <span className={isOverdue && !check.isPaid ? 'text-rose-600 font-bold' : ''}>
                          {formatDate(displayDate)}
                        </span>
                      </div>
                      {check.isRecurring && (
                        <span className="text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md flex items-center">
                           Tekrar Eden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5 ${statusBadgeStyles}`}>
                      {check.isPaid ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Ödendi
                        </>
                      ) : (
                        <>
                          {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          {daysUntil === 0 ? 'Bugün Son' : daysUntil > 0 ? `${daysUntil} Gün Kaldı` : `${Math.abs(daysUntil)} Gün Geçti`}
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => onTogglePaid(check.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all transform active:scale-95 ${
                        check.isPaid
                          ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-0.5'
                      }`}
                    >
                      {check.isPaid ? 'Geri Al' : 'Öde'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
