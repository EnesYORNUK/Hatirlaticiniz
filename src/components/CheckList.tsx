import React, { useState } from 'react';
import { Check } from '../types';
import { formatDate, getDaysUntilPayment, getPaymentStatus, getStatusColor, getStatusText } from '../utils/dateUtils';
import { Edit2, Trash2, CheckCircle, Circle, Calendar, User, Banknote, Search, CreditCard, Receipt, RotateCcw, Zap, Droplets, Flame, Phone, Wifi, FileText } from 'lucide-react';

interface CheckListProps {
  checks: Check[];
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

export default function CheckList({ checks, onEdit, onDelete, onTogglePaid }: CheckListProps) {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'paymentDate' | 'amount' | 'createdDate'>('paymentDate');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getBillTypeIcon = (billType?: string) => {
    switch (billType) {
      case 'elektrik': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'su': return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'dogalgaz': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'telefon': return <Phone className="h-4 w-4 text-green-500" />;
      case 'internet': return <Wifi className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBillTypeLabel = (billType?: string, customBillType?: string) => {
    if (billType === 'diger' && customBillType) {
      return customBillType;
    }
    
    const labels: Record<string, string> = {
      elektrik: 'Elektrik',
      su: 'Su',
      dogalgaz: 'Doğalgaz',
      telefon: 'Telefon',
      internet: 'İnternet',
      diger: 'Diğer'
    };
    
    return billType ? labels[billType] || billType : '';
  };

  const filteredChecks = checks.filter(check => {
    // Arama filtresi
    const searchLower = searchTerm.toLowerCase();
    const billTypeText = check.type === 'bill' ? getBillTypeLabel(check.billType, check.customBillType) : '';
    const matchesSearch = !searchTerm || 
      check.createdBy.toLowerCase().includes(searchLower) ||
      check.signedTo.toLowerCase().includes(searchLower) ||
      check.amount.toString().includes(searchLower) ||
      formatDate(check.paymentDate).includes(searchLower) ||
      formatDate(check.createdDate).includes(searchLower) ||
      billTypeText.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Durum filtresi
    if (filter === 'all') return true;
    if (filter === 'paid') return check.isPaid;
    if (filter === 'unpaid') return !check.isPaid;
    if (filter === 'overdue') return !check.isPaid && getDaysUntilPayment(check.paymentDate) < 0;
    if (filter === 'upcoming') return !check.isPaid && getDaysUntilPayment(check.paymentDate) >= 0;
    if (filter === 'checks') return check.type === 'check';
    if (filter === 'bills') return check.type === 'bill';
    if (filter === 'recurring') return check.isRecurring;
    return true;
  });

  const sortedChecks = [...filteredChecks].sort((a, b) => {
    if (sortBy === 'paymentDate') {
      return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
    }
    if (sortBy === 'amount') {
      return b.amount - a.amount;
    }
    if (sortBy === 'createdDate') {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    }
    return 0;
  });

  const stats = {
    total: checks.length,
    paid: checks.filter(c => c.isPaid).length,
    unpaid: checks.filter(c => !c.isPaid).length,
    overdue: checks.filter(c => !c.isPaid && getDaysUntilPayment(c.paymentDate) < 0).length,
    checks: checks.filter(c => c.type === 'check').length,
    bills: checks.filter(c => c.type === 'bill').length,
    recurring: checks.filter(c => c.isRecurring).length,
  };

  if (checks.length === 0) {
    return (
      <div className="theme-surface rounded-xl shadow-lg p-8 text-center border theme-border">
        <div className="w-16 h-16 theme-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Banknote className="h-8 w-8 theme-text-muted" />
        </div>
        <h3 className="text-lg font-medium theme-text mb-2">Henüz ödeme eklenmemiş</h3>
        <p className="theme-text-muted">İlk çek veya faturanızı eklemek için "Yeni Ekle" butonunu kullanın.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="theme-surface p-4 rounded-lg shadow-sm border theme-border">
          <div className="text-2xl font-bold theme-text">{stats.total}</div>
          <div className="text-sm theme-text-muted">Toplam</div>
        </div>
        <div className="theme-surface p-4 rounded-lg shadow-sm border theme-border">
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          <div className="text-sm theme-text-muted">Ödenen</div>
        </div>
        <div className="theme-surface p-4 rounded-lg shadow-sm border theme-border">
          <div className="text-2xl font-bold text-blue-600">{stats.unpaid}</div>
          <div className="text-sm theme-text-muted">Bekleyen</div>
        </div>
        <div className="theme-surface p-4 rounded-lg shadow-sm border theme-border">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm theme-text-muted">Vadesi Geçen</div>
        </div>
        <div className="theme-surface p-4 rounded-lg shadow-sm border theme-border">
          <div className="text-2xl font-bold text-purple-600">{stats.checks}</div>
          <div className="text-sm theme-text-muted">Çek</div>
        </div>
        <div className="theme-surface p-4 rounded-lg shadow-sm border theme-border">
          <div className="text-2xl font-bold text-orange-600">{stats.bills}</div>
          <div className="text-sm theme-text-muted">Fatura</div>
        </div>
        <div className="theme-surface p-4 rounded-lg shadow-sm border theme-border">
          <div className="text-2xl font-bold text-cyan-600">{stats.recurring}</div>
          <div className="text-sm theme-text-muted">Tekrarlayan</div>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="theme-surface rounded-lg shadow-sm p-4 border theme-border space-y-4">
        {/* Arama */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 theme-text-muted" />
          </div>
          <input
            type="text"
            placeholder="Kişi adı, fatura türü, miktar, tarih ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="theme-input w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center theme-text-muted hover:theme-text"
            >
              ×
            </button>
          )}
        </div>

        {/* Filtreler ve Sıralama */}
        <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="theme-input px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tümü</option>
              <option value="unpaid">Bekleyenler</option>
              <option value="paid">Ödenenler</option>
              <option value="overdue">Vadesi Geçenler</option>
              <option value="upcoming">Vadesi Gelenler</option>
              <option value="checks">Sadece Çekler</option>
              <option value="bills">Sadece Faturalar</option>
              <option value="recurring">Tekrarlayanlar</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="theme-input px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="paymentDate">Ödeme Tarihine Göre</option>
              <option value="amount">Miktara Göre</option>
              <option value="createdDate">Oluşturma Tarihine Göre</option>
            </select>
          </div>
          
          <div className="text-sm theme-text-muted">
            {filteredChecks.length} ödeme gösteriliyor
            {searchTerm && <span className="ml-1">"{searchTerm}" için</span>}
          </div>
        </div>
      </div>

      {/* Ödeme Listesi */}
      <div className="space-y-4">
        {sortedChecks.map(check => {
          const status = getPaymentStatus(check.paymentDate, check.isPaid);
          const daysUntil = getDaysUntilPayment(check.paymentDate);
          
          return (
            <div key={check.id} className="theme-surface rounded-lg shadow-sm border theme-border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onTogglePaid(check.id)}
                        className={`p-1 rounded-full transition-colors ${
                          check.isPaid ? 'text-green-600 hover:text-green-700' : 'theme-text-muted hover:theme-text'
                        }`}
                      >
                        {check.isPaid ? <CheckCircle className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        {check.type === 'check' ? (
                          <CreditCard className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Receipt className="h-5 w-5 text-orange-600" />
                        )}
                        
                        {check.type === 'bill' && (
                          <div className="flex items-center space-x-1">
                            {getBillTypeIcon(check.billType)}
                            <span className="text-sm font-medium theme-text">
                              {getBillTypeLabel(check.billType, check.customBillType)}
                            </span>
                          </div>
                        )}
                        
                        {check.isRecurring && (
                          <div className="flex items-center space-x-1">
                            <RotateCcw className="h-4 w-4 text-cyan-600" />
                            <span className="text-xs text-cyan-600 font-medium">
                              {check.recurringType === 'monthly' ? 'Aylık' : 
                               check.recurringType === 'weekly' ? 'Haftalık' : 'Yıllık'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                        {!check.isPaid && (
                          <span className="ml-2 text-sm theme-text-muted">
                            {daysUntil === 0 ? 'Bugün' : daysUntil > 0 ? `${daysUntil} gün kaldı` : `${Math.abs(daysUntil)} gün geçti`}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold theme-text">
                      {check.amount.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 theme-text-muted" />
                      <div>
                        <span className="theme-text-muted">Oluşturan:</span>
                        <span className="ml-1 font-medium theme-text">{check.createdBy}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 theme-text-muted" />
                      <div>
                        <span className="theme-text-muted">
                          {check.type === 'check' ? 'İmzalanan:' : 'Ödenecek:'}
                        </span>
                        <span className="ml-1 font-medium theme-text">{check.signedTo}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 theme-text-muted" />
                      <div>
                        <span className="theme-text-muted">Ödeme:</span>
                        <span className="ml-1 font-medium theme-text">{formatDate(check.paymentDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tekrarlayan ödeme bilgisi */}
                  {check.isRecurring && check.nextPaymentDate && (
                    <div className="flex items-center space-x-2 text-sm bg-cyan-50 px-3 py-2 rounded-lg border border-cyan-200">
                      <RotateCcw className="h-4 w-4 text-cyan-600" />
                      <span className="text-cyan-700">
                        Sonraki ödeme: <span className="font-medium">{formatDate(check.nextPaymentDate)}</span>
                        {check.recurringType === 'monthly' && check.recurringDay && 
                          ` (Her ayın ${check.recurringDay}. günü)`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onEdit(check)}
                    className="p-2 theme-text-muted hover:text-blue-600 transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(check.id)}
                    className="p-2 theme-text-muted hover:text-red-600 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}