import React, { useState, useMemo } from 'react';
import { Check } from '../types';
import { formatCurrency, formatDate, getDaysUntilPayment, getPaymentStatus } from '../utils/dateUtils';
import { Edit3, Trash2, DollarSign, Calendar, User, Building, Search, Filter, BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle, CreditCard, Receipt, RotateCcw } from 'lucide-react';

interface CheckListProps {
  checks: Check[];
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

type FilterType = 'all' | 'paid' | 'unpaid' | 'overdue' | 'upcoming' | 'check' | 'bill';
type SortType = 'paymentDate' | 'amount' | 'createdDate' | 'signedTo';

export default function CheckList({ checks, onEdit, onDelete, onTogglePaid }: CheckListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('paymentDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Dashboard istatistikleri
  const stats = useMemo(() => {
    const totalAmount = checks.reduce((sum, check) => sum + check.amount, 0);
    const paidAmount = checks.filter(check => check.isPaid).reduce((sum, check) => sum + check.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    const overdueAmount = checks
      .filter(check => !check.isPaid && getDaysUntilPayment(check.paymentDate) < 0)
      .reduce((sum, check) => sum + check.amount, 0);

    return {
      totalAmount,
      paidAmount,
      unpaidAmount,
      overdueAmount,
      totalCount: checks.length,
      paidCount: checks.filter(check => check.isPaid).length,
      unpaidCount: checks.filter(check => !check.isPaid).length,
      overdueCount: checks.filter(check => !check.isPaid && getDaysUntilPayment(check.paymentDate) < 0).length,
      paymentRate: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
    };
  }, [checks]);

  // Filtrelenmiş ve sıralanmış çekler
  const filteredAndSortedChecks = useMemo(() => {
    let filtered = checks.filter(check => {
      // Arama terimi filtresi
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          check.signedTo.toLowerCase().includes(searchLower) ||
          check.createdBy.toLowerCase().includes(searchLower) ||
          check.amount.toString().includes(searchLower) ||
          (check.type === 'bill' && check.billType?.toLowerCase().includes(searchLower)) ||
          (check.customBillType?.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Durum filtresi
      switch (filter) {
        case 'paid':
          return check.isPaid;
        case 'unpaid':
          return !check.isPaid;
        case 'overdue':
          return !check.isPaid && getDaysUntilPayment(check.paymentDate) < 0;
        case 'upcoming':
          return !check.isPaid && getDaysUntilPayment(check.paymentDate) >= 0 && getDaysUntilPayment(check.paymentDate) <= 7;
        case 'check':
          return check.type === 'check';
        case 'bill':
          return check.type === 'bill';
        default:
          return true;
      }
    });

    // Sıralama
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sort) {
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'createdDate':
          aVal = new Date(a.createdDate).getTime();
          bVal = new Date(b.createdDate).getTime();
          break;
        case 'signedTo':
          aVal = a.signedTo.toLowerCase();
          bVal = b.signedTo.toLowerCase();
          break;
        default: // paymentDate
          aVal = new Date(a.paymentDate).getTime();
          bVal = new Date(b.paymentDate).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [checks, searchTerm, filter, sort, sortDirection]);

  const getStatusColor = (check: Check) => {
    if (check.isPaid) return 'theme-success';
    const daysUntil = getDaysUntilPayment(check.paymentDate);
    if (daysUntil < 0) return 'theme-error';
    if (daysUntil <= 3) return 'theme-warning';
    return 'theme-info';
  };

  const getStatusIcon = (check: Check) => {
    if (check.isPaid) return <CheckCircle className="w-4 h-4" />;
    const daysUntil = getDaysUntilPayment(check.paymentDate);
    if (daysUntil < 0) return <AlertTriangle className="w-4 h-4" />;
    if (daysUntil <= 3) return <Clock className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const getBillTypeIcon = (billType: string) => {
    const icons: Record<string, string> = {
      elektrik: '⚡',
      su: '💧',
      dogalgaz: '🔥',
      telefon: '📞',
      internet: '🌐',
      diger: '📄'
    };
    return icons[billType] || '📄';
  };

  if (checks.length === 0) {
    return (
      <div className="theme-bg min-h-screen">
        <div className="theme-surface rounded-xl shadow-sm border theme-border p-12 text-center">
          <div className="theme-text-muted mb-4">
            <CreditCard className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="theme-text text-xl font-semibold mb-2">Henüz Ödeme Yok</h3>
          <p className="theme-text-muted mb-6">İlk çek veya faturanızı ekleyerek başlayın</p>
          <button className="theme-button px-6 py-3 rounded-lg font-medium">
            Yeni Ödeme Ekle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-bg min-h-screen space-y-6">
      {/* Dashboard İstatistikleri */}
      <div className="theme-surface rounded-xl shadow-sm border theme-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="theme-primary rounded-full p-2">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="theme-text text-xl font-bold">Ödeme Özeti</h2>
            <p className="theme-text-muted text-sm">Genel durum ve istatistikler</p>
          </div>
        </div>

        {/* Ana İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="theme-text-muted text-sm font-medium">Toplam Tutar</p>
                <p className="theme-text text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="theme-primary rounded-full p-2">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="theme-text-muted text-xs">{stats.totalCount} ödeme</span>
            </div>
          </div>

          <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="theme-text-muted text-sm font-medium">Ödenen</p>
                <p className="text-green-600 text-2xl font-bold">{formatCurrency(stats.paidAmount)}</p>
              </div>
              <div className="bg-green-500 rounded-full p-2">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="theme-text-muted text-xs">{stats.paidCount} ödeme</span>
            </div>
          </div>

          <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="theme-text-muted text-sm font-medium">Bekleyen</p>
                <p className="text-orange-600 text-2xl font-bold">{formatCurrency(stats.unpaidAmount)}</p>
              </div>
              <div className="bg-orange-500 rounded-full p-2">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="theme-text-muted text-xs">{stats.unpaidCount} ödeme</span>
            </div>
          </div>

          <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="theme-text-muted text-sm font-medium">Vadesi Geçen</p>
                <p className="text-red-600 text-2xl font-bold">{formatCurrency(stats.overdueAmount)}</p>
              </div>
              <div className="bg-red-500 rounded-full p-2">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="theme-text-muted text-xs">{stats.overdueCount} ödeme</span>
            </div>
          </div>
        </div>

        {/* Ödeme Oranı Progress Bar */}
        <div className="theme-bg-secondary rounded-lg p-4 border theme-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="theme-text font-medium">Ödeme Oranı</h3>
            <span className="theme-text text-sm font-bold">%{stats.paymentRate}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.paymentRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="theme-text-muted text-xs">0%</span>
            <span className="theme-text-muted text-xs">100%</span>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="theme-surface rounded-xl shadow-sm border theme-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="theme-primary rounded-full p-2">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h3 className="theme-text text-lg font-semibold">Ara ve Filtrele</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Firma, kişi, tutar ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="theme-input w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-muted w-4 h-4" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="theme-input w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">🔍 Tümü</option>
              <option value="unpaid">⏳ Bekleyen</option>
              <option value="paid">✅ Ödenen</option>
              <option value="overdue">⚠️ Vadesi Geçen</option>
              <option value="upcoming">📅 Yaklaşan (7 gün)</option>
              <option value="check">📄 Çekler</option>
              <option value="bill">🧾 Faturalar</option>
            </select>
          </div>

          {/* Sıralama */}
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-muted w-4 h-4" />
            <select
              value={`${sort}-${sortDirection}`}
              onChange={(e) => {
                const [newSort, direction] = e.target.value.split('-');
                setSort(newSort as SortType);
                setSortDirection(direction as 'asc' | 'desc');
              }}
              className="theme-input w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="paymentDate-asc">📅 Tarihe göre (Yakın)</option>
              <option value="paymentDate-desc">📅 Tarihe göre (Uzak)</option>
              <option value="amount-desc">💰 Tutara göre (Yüksek)</option>
              <option value="amount-asc">💰 Tutara göre (Düşük)</option>
              <option value="signedTo-asc">🏢 Firmaya göre (A-Z)</option>
              <option value="signedTo-desc">🏢 Firmaya göre (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Aktif Filtre Durumu */}
        <div className="flex items-center gap-2 mt-4">
          <span className="theme-text-muted text-sm">
            {filteredAndSortedChecks.length} / {checks.length} ödeme gösteriliyor
          </span>
          {(searchTerm || filter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
              className="theme-button-secondary px-3 py-1 text-xs rounded-lg"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Ödeme Listesi */}
      <div className="space-y-4">
        {filteredAndSortedChecks.map((check) => (
          <div
            key={check.id}
            className="theme-surface rounded-xl shadow-sm border theme-border p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              {/* Sol taraf - Ana bilgiler */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {/* Tip ikonu */}
                  <div className={`p-2 rounded-lg ${
                    check.type === 'check' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {check.type === 'check' ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <Receipt className="w-5 h-5" />
                    )}
                  </div>

                  {/* Başlık ve fatura türü */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="theme-text text-lg font-semibold">
                        {check.type === 'check' ? 'Çek' : 'Fatura'}
                      </h3>
                      {check.type === 'bill' && (
                        <span className="text-sm bg-gray-100 theme-text px-2 py-1 rounded-full">
                          {getBillTypeIcon(check.billType || 'diger')} {
                            check.billType === 'diger' ? check.customBillType : 
                            check.billType === 'elektrik' ? 'Elektrik' :
                            check.billType === 'su' ? 'Su' :
                            check.billType === 'dogalgaz' ? 'Doğalgaz' :
                            check.billType === 'telefon' ? 'Telefon' :
                            check.billType === 'internet' ? 'İnternet' : 'Diğer'
                          }
                        </span>
                      )}
                      {check.isRecurring && (
                        <span className="text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded-full flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          Tekrarlayan
                        </span>
                      )}
                    </div>
                    <p className="theme-text-muted text-sm">#{check.id.slice(-8)}</p>
                  </div>

                  {/* Durum etiketi */}
                  <div className={`${getStatusColor(check)} px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium text-white`}>
                    {getStatusIcon(check)}
                    {getPaymentStatus(check.paymentDate, check.isPaid)}
                  </div>
                </div>

                {/* Detay bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Building className="theme-text-muted w-4 h-4" />
                    <div>
                      <p className="theme-text-muted text-xs">Ödenecek</p>
                      <p className="theme-text text-sm font-medium">{check.signedTo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="theme-text-muted w-4 h-4" />
                    <div>
                      <p className="theme-text-muted text-xs">Tutar</p>
                      <p className="theme-text text-sm font-medium">{formatCurrency(check.amount)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="theme-text-muted w-4 h-4" />
                    <div>
                      <p className="theme-text-muted text-xs">Ödeme Tarihi</p>
                      <p className="theme-text text-sm font-medium">{formatDate(check.paymentDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Oluşturan kişi */}
                <div className="flex items-center gap-2 mt-3">
                  <User className="theme-text-muted w-4 h-4" />
                  <span className="theme-text-muted text-sm">
                    {check.createdBy} tarafından {formatDate(check.createdDate)} tarihinde oluşturuldu
                  </span>
                </div>
              </div>

              {/* Sağ taraf - Aksiyonlar */}
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => onTogglePaid(check.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    check.isPaid 
                      ? 'bg-gray-100 theme-text hover:bg-gray-200' 
                      : 'theme-success text-white hover:bg-green-600'
                  }`}
                >
                  {check.isPaid ? 'Ödenmedi' : 'Ödendi'}
                </button>

                <button
                  onClick={() => onEdit(check)}
                  className="theme-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Düzenle
                </button>

                <button
                  onClick={() => {
                    const itemType = check.type === 'bill' ? 'faturayı' : 'çeki';
                    if (confirm(`Bu ${itemType} silmek istediğinizden emin misiniz?`)) {
                      onDelete(check.id);
                    }
                  }}
                  className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Boş durum (filtreleme sonucu) */}
      {filteredAndSortedChecks.length === 0 && checks.length > 0 && (
        <div className="theme-surface rounded-xl shadow-sm border theme-border p-12 text-center">
          <div className="theme-text-muted mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="theme-text text-xl font-semibold mb-2">Sonuç Bulunamadı</h3>
          <p className="theme-text-muted mb-6">Arama kriterlerinize uygun ödeme bulunamadı</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilter('all');
            }}
            className="theme-button px-6 py-3 rounded-lg font-medium"
          >
            Filtreleri Temizle
          </button>
        </div>
      )}
    </div>
  );
}