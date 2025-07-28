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
    // Tutar hesaplamaları
    totalAmount: checks.reduce((sum, c) => sum + c.amount, 0),
    paidAmount: checks.filter(c => c.isPaid).reduce((sum, c) => sum + c.amount, 0),
    unpaidAmount: checks.filter(c => !c.isPaid).reduce((sum, c) => sum + c.amount, 0),
    overdueAmount: checks.filter(c => !c.isPaid && getDaysUntilPayment(c.paymentDate) < 0).reduce((sum, c) => sum + c.amount, 0),
  };

  if (checks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Banknote className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ödeme eklenmemiş</h3>
        <p className="text-gray-500">İlk çek veya faturanızı eklemek için "Yeni Ekle" butonunu kullanın.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Banknote className="h-6 w-6 mr-2 text-blue-600" />
          Ödeme Özeti
        </h2>
        
        {/* Ana İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Toplam */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Toplam Ödeme</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                <p className="text-sm text-blue-700 mt-1">
                  {stats.totalAmount.toLocaleString('tr-TR')} ₺
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <Banknote className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Bekleyen */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Bekleyen</p>
                <p className="text-3xl font-bold text-orange-900">{stats.unpaid}</p>
                <p className="text-sm text-orange-700 mt-1">
                  {stats.unpaidAmount.toLocaleString('tr-TR')} ₺
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-full">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Ödenen */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Ödenen</p>
                <p className="text-3xl font-bold text-green-900">{stats.paid}</p>
                <p className="text-sm text-green-700 mt-1">
                  {stats.paidAmount.toLocaleString('tr-TR')} ₺
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Alt Bilgiler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Vadesi Geçen - Acil */}
          {stats.overdue > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <div className="bg-red-500 p-2 rounded-full mr-3">
                  <Circle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-red-900 font-bold">{stats.overdue}</p>
                  <p className="text-red-600 text-xs">Vadesi Geçen</p>
                  <p className="text-red-700 text-xs font-medium">
                    {stats.overdueAmount.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Çek Sayısı */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="bg-purple-500 p-2 rounded-full mr-3">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-purple-900 font-bold">{stats.checks}</p>
                <p className="text-purple-600 text-xs">Çek</p>
              </div>
            </div>
          </div>

          {/* Fatura Sayısı */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <div className="bg-orange-500 p-2 rounded-full mr-3">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-orange-900 font-bold">{stats.bills}</p>
                <p className="text-orange-600 text-xs">Fatura</p>
              </div>
            </div>
          </div>

          {/* Tekrarlayan */}
          <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
            <div className="flex items-center">
              <div className="bg-cyan-500 p-2 rounded-full mr-3">
                <RotateCcw className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-cyan-900 font-bold">{stats.recurring}</p>
                <p className="text-cyan-600 text-xs">Tekrarlayan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ödeme Oranı */}
        {stats.total > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Ödeme Oranı</span>
              <span className="text-sm font-medium text-gray-900">
                %{Math.round((stats.paid / stats.total) * 100)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.paid / stats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Arama ve Filtreler */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 space-y-4">
        {/* Arama */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Kişi adı, fatura türü, miktar, tarih ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="paymentDate">Ödeme Tarihine Göre</option>
              <option value="amount">Miktara Göre</option>
              <option value="createdDate">Oluşturma Tarihine Göre</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
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
            <div key={check.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onTogglePaid(check.id)}
                        className={`p-1 rounded-full transition-colors ${
                          check.isPaid ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'
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
                            <span className="text-sm font-medium text-gray-700">
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
                          <span className="ml-2 text-sm text-gray-500">
                            {daysUntil === 0 ? 'Bugün' : daysUntil > 0 ? `${daysUntil} gün kaldı` : `${Math.abs(daysUntil)} gün geçti`}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold text-gray-900">
                      {check.amount.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600">Oluşturan:</span>
                        <span className="ml-1 font-medium text-gray-900">{check.createdBy}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600">Ödenecek:</span>
                        <span className="ml-1 font-medium text-gray-900">{check.signedTo}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600">Ödeme:</span>
                        <span className="ml-1 font-medium text-gray-900">{formatDate(check.paymentDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tekrarlayan ödeme bilgisi */}
                  {check.isRecurring && check.nextPaymentDate && (
                    <div className="flex items-center space-x-2 text-sm bg-cyan-50 px-3 py-2 rounded-lg">
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
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(check.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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