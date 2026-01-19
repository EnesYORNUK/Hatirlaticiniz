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
    <div className="space-y-6 animate-fade-in">
      {/* Simple Summary Strip */}
      <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => toggleStatusFilter('unpaid')}
          className={`flex-1 flex items-center justify-between p-3 rounded-xl transition-colors ${statusFilter === 'unpaid' ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Ödenecek</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(stats.unpaid)}</div>
            </div>
          </div>
        </button>

        <div className="w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

        <button 
          onClick={() => toggleStatusFilter('paid')}
          className={`flex-1 flex items-center justify-between p-3 rounded-xl transition-colors ${statusFilter === 'paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Ödenen</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(stats.paid)}</div>
            </div>
          </div>
        </button>

        <div className="w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

        <button 
          onClick={() => toggleStatusFilter('overdue')}
          className={`flex-1 flex items-center justify-between p-3 rounded-xl transition-colors ${statusFilter === 'overdue' ? 'bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Geciken</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(stats.overdue)}</div>
            </div>
          </div>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="today">Bugün</option>
            <option value="thisWeek">Bu Hafta</option>
            <option value="thisMonth">Bu Ay</option>
            <option value="thisYear">Bu Yıl</option>
          </select>

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

            return (
              <div
                key={check.id}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-md"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${
                        check.type === 'check' 
                          ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                          : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                      }`}>
                        {check.type === 'check' ? <CreditCard className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {check.type === 'check' ? 'Çek' : 'Fatura'}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                          {check.signedTo}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(check)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(check.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(check.amount)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className={isOverdue ? 'text-rose-600 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                        {formatDate(displayDate)}
                      </span>
                      {check.isRecurring && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                          Tekrar eden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div className={`text-sm font-medium ${
                      check.isPaid 
                        ? 'text-emerald-600' 
                        : isOverdue 
                        ? 'text-rose-600' 
                        : isToday 
                        ? 'text-orange-600' 
                        : 'text-slate-500'
                    }`}>
                      {check.isPaid ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          Ödendi
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {daysUntil === 0 ? 'Bugün son gün' : daysUntil > 0 ? `${daysUntil} gün kaldı` : `${Math.abs(daysUntil)} gün geçti`}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onTogglePaid(check.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        check.isPaid
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow'
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
