import React, { useState } from 'react';
import { Check } from '../types';
import { formatDate, getDaysUntilPayment } from '../utils/dateUtils';
import { Edit2, Trash2, CheckCircle, Circle, Calendar, User, Banknote, Search, CreditCard, Receipt } from 'lucide-react';

interface CheckListProps {
  checks: Check[];
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

export default function CheckList({ checks, onEdit, onDelete, onTogglePaid }: CheckListProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dashboardPeriod, setDashboardPeriod] = useState<string>('all'); // all, thisMonth, thisYear

  const filteredChecks = checks.filter(check => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      check.createdBy.toLowerCase().includes(searchLower) ||
      check.signedTo.toLowerCase().includes(searchLower) ||
      check.amount.toString().includes(searchLower);

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'paid') return check.isPaid;
    if (filter === 'unpaid') return !check.isPaid;
    if (filter === 'overdue') return !check.isPaid && getDaysUntilPayment(check.paymentDate) < 0;
    return true;
  });

  const sortedChecks = [...filteredChecks].sort((a, b) => {
    return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
  });

  // Dashboard için tarih filtresi
  const getDashboardChecks = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (dashboardPeriod) {
      case 'thisMonth':
        return checks.filter(check => {
          const checkDate = new Date(check.paymentDate);
          return checkDate.getMonth() === currentMonth && checkDate.getFullYear() === currentYear;
        });
      case 'thisYear':
        return checks.filter(check => {
          const checkDate = new Date(check.paymentDate);
          return checkDate.getFullYear() === currentYear;
        });
      default:
        return checks;
    }
  };

  const dashboardChecks = getDashboardChecks();
  
  const stats = {
    total: dashboardChecks.length,
    paid: dashboardChecks.filter(c => c.isPaid).length,
    unpaid: dashboardChecks.filter(c => !c.isPaid).length,
    overdue: dashboardChecks.filter(c => !c.isPaid && getDaysUntilPayment(c.paymentDate) < 0).length,
    totalAmount: dashboardChecks.reduce((sum, c) => sum + c.amount, 0),
    paidAmount: dashboardChecks.filter(c => c.isPaid).reduce((sum, c) => sum + c.amount, 0),
    unpaidAmount: dashboardChecks.filter(c => !c.isPaid).reduce((sum, c) => sum + c.amount, 0),
    overdueAmount: dashboardChecks.filter(c => !c.isPaid && getDaysUntilPayment(c.paymentDate) < 0).reduce((sum, c) => sum + c.amount, 0),
  };

  const getPeriodText = () => {
    const now = new Date();
    switch (dashboardPeriod) {
      case 'thisMonth':
        return now.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
      case 'thisYear':
        return now.getFullYear().toString();
      default:
        return 'Tümü';
    }
  };

  if (checks.length === 0) {
    return (
      <div className="theme-surface rounded-lg shadow-sm p-8 text-center border theme-border">
        <div className="w-16 h-16 theme-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Banknote className="h-8 w-8 theme-text-muted" />
        </div>
        <h3 className="text-lg font-semibold theme-text mb-2">Henüz ödeme eklenmemiş</h3>
        <p className="theme-text-muted">İlk çek veya faturanızı eklemek için "Yeni Ekle" butonunu kullanın.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Enhanced Dashboard */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold theme-text">Dashboard</h2>
          <select
            value={dashboardPeriod}
            onChange={(e) => setDashboardPeriod(e.target.value)}
            className="theme-input text-sm py-1 px-3"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="thisMonth">Bu Ay</option>
            <option value="thisYear">Bu Yıl</option>
          </select>
        </div>

        {/* Period Info */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold theme-text">{getPeriodText()}</h3>
          <p className="text-sm theme-text-muted">Toplam {stats.totalAmount.toLocaleString('tr-TR')} ₺</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Toplam */}
          <div className="theme-surface p-4 rounded-lg shadow-sm border theme-border text-center">
            <div className="text-2xl font-bold theme-text">{stats.total}</div>
            <div className="text-xs theme-text-muted mb-1">Toplam Ödeme</div>
            <div className="text-sm font-medium theme-text">
              {stats.totalAmount.toLocaleString('tr-TR')} ₺
            </div>
          </div>
          
          {/* Ödenen */}
          <div className="theme-surface p-4 rounded-lg shadow-sm border border-green-200 text-center bg-green-50">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-xs text-green-700 mb-1">Ödenen</div>
            <div className="text-sm font-medium text-green-700">
              {stats.paidAmount.toLocaleString('tr-TR')} ₺
            </div>
          </div>
          
          {/* Bekleyen */}
          <div className="theme-surface p-4 rounded-lg shadow-sm border border-blue-200 text-center bg-blue-50">
            <div className="text-2xl font-bold text-blue-600">{stats.unpaid}</div>
            <div className="text-xs text-blue-700 mb-1">Bekleyen</div>
            <div className="text-sm font-medium text-blue-700">
              {stats.unpaidAmount.toLocaleString('tr-TR')} ₺
            </div>
          </div>
          
          {/* Geciken */}
          <div className="theme-surface p-4 rounded-lg shadow-sm border border-red-200 text-center bg-red-50">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs text-red-700 mb-1">Geciken</div>
            <div className="text-sm font-medium text-red-700">
              {stats.overdueAmount.toLocaleString('tr-TR')} ₺
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        {stats.total > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium theme-text">Ödeme Oranı</div>
              <div className="text-green-600 font-bold">
                %{Math.round((stats.paid / stats.total) * 100)}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium theme-text">Ortalama Ödeme</div>
              <div className="theme-text font-bold">
                {Math.round(stats.totalAmount / stats.total).toLocaleString('tr-TR')} ₺
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium theme-text">Kalan Borç</div>
              <div className="text-red-600 font-bold">
                {stats.unpaidAmount.toLocaleString('tr-TR')} ₺
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="theme-surface rounded-lg shadow-sm p-4 border theme-border space-y-4">
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 theme-text-muted" />
          </div>
          <input
            type="text"
            placeholder="Kişi adı, firma adı veya tutar ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="theme-input w-full pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center theme-text-muted hover:theme-text text-lg font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Tümü', count: stats.total },
            { id: 'unpaid', label: 'Bekleyen', count: stats.unpaid },
            { id: 'paid', label: 'Ödenen', count: stats.paid },
            { id: 'overdue', label: 'Geciken', count: stats.overdue },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === item.id
                  ? 'theme-primary text-white'
                  : 'theme-surface theme-border theme-text hover:theme-bg-secondary border'
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        {filteredChecks.length !== checks.length && (
          <div className="text-sm theme-text-muted">
            {filteredChecks.length} ödeme gösteriliyor
            {searchTerm && <span className="ml-1">"{searchTerm}" araması için</span>}
          </div>
        )}
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {sortedChecks.map(check => {
          const daysUntil = getDaysUntilPayment(check.paymentDate);
          const isOverdue = !check.isPaid && daysUntil < 0;
          const isToday = daysUntil === 0;
          
          return (
            <div 
              key={check.id} 
              className={`theme-surface rounded-lg shadow-sm border p-4 transition-all hover:shadow-md ${
                check.isPaid 
                  ? 'border-green-200 bg-green-50' 
                  : isOverdue 
                    ? 'border-red-200 bg-red-50' 
                    : isToday
                      ? 'border-orange-200 bg-orange-50'
                      : 'theme-border'
              }`}
            >
              <div className="flex items-center justify-between">
                
                {/* Left Side */}
                <div className="flex items-center gap-3 flex-1">
                  
                  {/* Status Toggle */}
                  <button
                    onClick={() => onTogglePaid(check.id)}
                    className={`p-1.5 rounded-full transition-all ${
                      check.isPaid 
                        ? 'text-green-600 hover:text-green-700' 
                        : 'theme-text-muted hover:theme-text'
                    }`}
                  >
                    {check.isPaid ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  
                  {/* Type Icon */}
                  <div className={`p-2 rounded-lg ${
                    check.type === 'check' ? 'bg-purple-100' : 'bg-orange-100'
                  }`}>
                    {check.type === 'check' ? (
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Receipt className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="theme-text font-medium truncate">
                        {check.signedTo}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        check.isPaid 
                          ? 'bg-green-100 text-green-700' 
                          : isOverdue 
                            ? 'bg-red-100 text-red-700'
                            : isToday
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}>
                        {check.isPaid 
                          ? 'Ödendi' 
                          : isOverdue 
                            ? 'Gecikti'
                            : isToday
                              ? 'Bugün'
                              : 'Beklemede'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm theme-text-muted">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {check.createdBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(check.paymentDate)}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        ✓ {formatDate(check.createdAt)}
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
                <div className="flex items-center gap-3">
                  
                  {/* Amount */}
                  <div className="text-right">
                    <div className="text-lg font-bold theme-text">
                      {check.amount.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(check)}
                      className="p-2 theme-text-muted hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                      title="Düzenle"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(check.id)}
                      className="p-2 theme-text-muted hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
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
      
      {/* No Results */}
      {filteredChecks.length === 0 && checks.length > 0 && (
        <div className="theme-surface rounded-lg shadow-sm p-8 text-center border theme-border">
          <div className="w-16 h-16 theme-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 theme-text-muted" />
          </div>
          <h3 className="text-lg font-semibold theme-text mb-2">Arama sonucu bulunamadı</h3>
          <p className="theme-text-muted">
            "{searchTerm}" aramanız için uygun ödeme bulunamadı.<br/>
            Farklı anahtar kelimeler deneyin veya filtreleri değiştirin.
          </p>
        </div>
      )}
    </div>
  );
}