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

  const stats = {
    total: checks.length,
    paid: checks.filter(c => c.isPaid).length,
    unpaid: checks.filter(c => !c.isPaid).length,
    overdue: checks.filter(c => !c.isPaid && getDaysUntilPayment(c.paymentDate) < 0).length,
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
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="theme-surface p-4 rounded-lg shadow-sm border theme-border text-center">
          <div className="text-2xl font-bold theme-text">{stats.total}</div>
          <div className="text-sm theme-text-muted">Toplam</div>
        </div>
        <div className="theme-surface p-4 rounded-lg shadow-sm border border-green-200 text-center bg-green-50">
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          <div className="text-sm text-green-700">Ödenen</div>
        </div>
        <div className="theme-surface p-4 rounded-lg shadow-sm border border-blue-200 text-center bg-blue-50">
          <div className="text-2xl font-bold text-blue-600">{stats.unpaid}</div>
          <div className="text-sm text-blue-700">Bekleyen</div>
        </div>
        <div className="theme-surface p-4 rounded-lg shadow-sm border border-red-200 text-center bg-red-50">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-red-700">Geciken</div>
        </div>
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
            className="theme-input w-full pl-10 pr-3"
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