import React, { useState } from 'react';
import { Check } from '../types';
import { formatDate, getDaysUntilPayment, getPaymentStatus, getStatusColor, getStatusText } from '../utils/dateUtils';
import { Edit2, Trash2, CheckCircle, Circle, Calendar, User, Banknote, Search } from 'lucide-react';

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

  const filteredChecks = checks.filter(check => {
    // Arama filtresi
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      check.createdBy.toLowerCase().includes(searchLower) ||
      check.signedTo.toLowerCase().includes(searchLower) ||
      check.amount.toString().includes(searchLower) ||
      formatDate(check.paymentDate).includes(searchLower) ||
      formatDate(check.createdDate).includes(searchLower);

    if (!matchesSearch) return false;

    // Durum filtresi
    if (filter === 'all') return true;
    if (filter === 'paid') return check.isPaid;
    if (filter === 'unpaid') return !check.isPaid;
    if (filter === 'overdue') return !check.isPaid && getDaysUntilPayment(check.paymentDate) < 0;
    if (filter === 'upcoming') return !check.isPaid && getDaysUntilPayment(check.paymentDate) >= 0;
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
  };

  if (checks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Banknote className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz çek eklenmemiş</h3>
        <p className="text-gray-500">İlk çekinizi eklemek için "Çek Ekle" butonunu kullanın.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Toplam Çek</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          <div className="text-sm text-gray-600">Ödenen</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.unpaid}</div>
          <div className="text-sm text-gray-600">Bekleyen</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Vadesi Geçen</div>
        </div>
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
            placeholder="Kişi adı, miktar, tarih ile ara..."
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
              <option value="all">Tüm Çekler</option>
              <option value="unpaid">Bekleyenler</option>
              <option value="paid">Ödenenler</option>
              <option value="overdue">Vadesi Geçenler</option>
              <option value="upcoming">Vadesi Gelenler</option>
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
            {filteredChecks.length} çek gösteriliyor
            {searchTerm && <span className="ml-1">"{searchTerm}" için</span>}
          </div>
        </div>
      </div>

      {/* Çek Listesi */}
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
                        <span className="text-gray-600">İmzalanan:</span>
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