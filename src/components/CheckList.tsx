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
      <div className="theme-surface rounded-2xl shadow-xl p-12 text-center border-2 theme-border">
        <div className="w-24 h-24 theme-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
          <Banknote className="h-12 w-12 theme-text-muted" />
        </div>
        <h3 className="text-2xl font-bold theme-text mb-4">Henüz Ödeme Yok! 📝</h3>
        <p className="theme-text-muted text-lg leading-relaxed">
          İlk çek veya faturanızı eklemek için yukarıdaki<br/>
          <strong>"➕ YENİ EKLE"</strong> butonunu kullanın.
        </p>
        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-blue-700 font-medium">
            💡 Bu program ile çeklerinizi ve faturalarınızı takip edebilir,<br/>
            ödeme tarihleri yaklaştığında hatırlatma alabilirsiniz!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Özet Bilgileri - Basit */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="theme-surface p-6 rounded-xl shadow-lg border-2 theme-border text-center">
          <div className="text-4xl font-bold theme-text mb-2">{stats.total}</div>
          <div className="text-lg theme-text-muted font-medium">📊 Toplam</div>
        </div>
        <div className="theme-surface p-6 rounded-xl shadow-lg border-2 border-green-200 text-center bg-green-50">
          <div className="text-4xl font-bold text-green-600 mb-2">{stats.paid}</div>
          <div className="text-lg text-green-700 font-medium">✅ Ödenen</div>
        </div>
        <div className="theme-surface p-6 rounded-xl shadow-lg border-2 border-blue-200 text-center bg-blue-50">
          <div className="text-4xl font-bold text-blue-600 mb-2">{stats.unpaid}</div>
          <div className="text-lg text-blue-700 font-medium">⏳ Bekleyen</div>
        </div>
        <div className="theme-surface p-6 rounded-xl shadow-lg border-2 border-red-200 text-center bg-red-50">
          <div className="text-4xl font-bold text-red-600 mb-2">{stats.overdue}</div>
          <div className="text-lg text-red-700 font-medium">🚨 Geciken</div>
        </div>
      </div>

      {/* Arama ve Basit Filtreler */}
      <div className="theme-surface rounded-xl shadow-lg p-6 border-2 theme-border space-y-6">
        
        {/* Arama */}
        <div>
          <h3 className="theme-text text-xl font-bold mb-3">🔍 Arama Yapın</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 theme-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Kişi adı, firma adı veya tutar yazın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="theme-input w-full pl-12 pr-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-blue-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center theme-text-muted hover:theme-text text-2xl"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Basit Filtreler */}
        <div>
          <h3 className="theme-text text-xl font-bold mb-3">📋 Filtrele</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`p-4 rounded-xl border-2 transition-all text-center font-bold ${
                filter === 'all'
                  ? 'theme-primary text-white border-blue-600'
                  : 'theme-surface theme-border theme-text hover:theme-bg-secondary'
              }`}
            >
              📊 HEPSİ<br/>
              <span className="text-sm opacity-80">{stats.total} ödeme</span>
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`p-4 rounded-xl border-2 transition-all text-center font-bold ${
                filter === 'unpaid'
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'theme-surface theme-border theme-text hover:theme-bg-secondary'
              }`}
            >
              ⏳ BEKLEYEN<br/>
              <span className="text-sm opacity-80">{stats.unpaid} ödeme</span>
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`p-4 rounded-xl border-2 transition-all text-center font-bold ${
                filter === 'paid'
                  ? 'bg-green-500 text-white border-green-600'
                  : 'theme-surface theme-border theme-text hover:theme-bg-secondary'
              }`}
            >
              ✅ ÖDENEN<br/>
              <span className="text-sm opacity-80">{stats.paid} ödeme</span>
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`p-4 rounded-xl border-2 transition-all text-center font-bold ${
                filter === 'overdue'
                  ? 'bg-red-500 text-white border-red-600'
                  : 'theme-surface theme-border theme-text hover:theme-bg-secondary'
              }`}
            >
              🚨 GECİKEN<br/>
              <span className="text-sm opacity-80">{stats.overdue} ödeme</span>
            </button>
          </div>
        </div>

        <div className="theme-text-muted text-center">
          <strong>{filteredChecks.length}</strong> ödeme gösteriliyor
          {searchTerm && <span className="ml-1">"{searchTerm}" araması için</span>}
        </div>
      </div>

      {/* Ödeme Kartları - Büyük ve Basit */}
      <div className="space-y-6">
        {sortedChecks.map(check => {
          const daysUntil = getDaysUntilPayment(check.paymentDate);
          const isOverdue = !check.isPaid && daysUntil < 0;
          const isToday = daysUntil === 0;
          
          return (
            <div 
              key={check.id} 
              className={`theme-surface rounded-2xl shadow-xl border-3 p-8 transition-all hover:shadow-2xl ${
                check.isPaid 
                  ? 'border-green-200 bg-green-50' 
                  : isOverdue 
                    ? 'border-red-200 bg-red-50' 
                    : isToday
                      ? 'border-orange-200 bg-orange-50'
                      : 'theme-border'
              }`}
            >
              <div className="flex items-start justify-between">
                
                {/* Ana Bilgiler */}
                <div className="flex-1 space-y-6">
                  
                  {/* Üst Kısım: Durum ve Tip */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      
                      {/* Ödeme Durumu Butonu */}
                      <button
                        onClick={() => onTogglePaid(check.id)}
                        className={`p-3 rounded-full transition-all shadow-lg ${
                          check.isPaid 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'theme-bg-secondary theme-text-muted hover:bg-gray-300'
                        }`}
                      >
                        {check.isPaid ? <CheckCircle className="h-8 w-8" /> : <Circle className="h-8 w-8" />}
                      </button>
                      
                      {/* Tip İkonu */}
                      <div className="flex items-center space-x-3">
                        {check.type === 'check' ? (
                          <div className="p-3 bg-purple-100 rounded-xl">
                            <CreditCard className="h-8 w-8 text-purple-600" />
                          </div>
                        ) : (
                          <div className="p-3 bg-orange-100 rounded-xl">
                            <Receipt className="h-8 w-8 text-orange-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-xl font-bold theme-text">
                            {check.type === 'check' ? '💳 ÇEK' : '🧾 FATURA'}
                          </div>
                          <div className="text-lg theme-text-muted">
                            {check.type === 'check' ? 'Banka çeki' : 'Fatura ödemesi'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Durum Etiketi */}
                      <div className={`px-6 py-3 rounded-xl font-bold text-lg ${
                        check.isPaid 
                          ? 'bg-green-500 text-white' 
                          : isOverdue 
                            ? 'bg-red-500 text-white'
                            : isToday
                              ? 'bg-orange-500 text-white'
                              : 'bg-blue-500 text-white'
                      }`}>
                        {check.isPaid 
                          ? '✅ ÖDENDİ' 
                          : isOverdue 
                            ? '🚨 GECİKTİ'
                            : isToday
                              ? '⚡ BUGÜN'
                              : '⏳ BEKLEMEDE'
                        }
                      </div>
                    </div>
                    
                    {/* Tutar */}
                    <div className="text-right">
                      <div className="text-4xl font-bold theme-text">
                        {check.amount.toLocaleString('tr-TR')} ₺
                      </div>
                      {!check.isPaid && (
                        <div className={`text-lg font-medium ${
                          isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'theme-text-muted'
                        }`}>
                          {daysUntil === 0 
                            ? '📅 Bugün ödenecek' 
                            : daysUntil > 0 
                              ? `📅 ${daysUntil} gün kaldı`
                              : `🚨 ${Math.abs(daysUntil)} gün geçti`
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alt Kısım: Detaylar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Kim Ödeyecek */}
                    <div className="flex items-center space-x-3 p-4 theme-bg-secondary rounded-xl">
                      <User className="h-6 w-6 theme-text-muted" />
                      <div>
                        <div className="text-sm theme-text-muted font-medium">Kim ödeyecek?</div>
                        <div className="text-lg font-bold theme-text">{check.createdBy}</div>
                      </div>
                    </div>
                    
                    {/* Kime Ödenecek */}
                    <div className="flex items-center space-x-3 p-4 theme-bg-secondary rounded-xl">
                      <User className="h-6 w-6 theme-text-muted" />
                      <div>
                        <div className="text-sm theme-text-muted font-medium">Kime ödenecek?</div>
                        <div className="text-lg font-bold theme-text">{check.signedTo}</div>
                      </div>
                    </div>
                    
                    {/* Ödeme Tarihi */}
                    <div className="flex items-center space-x-3 p-4 theme-bg-secondary rounded-xl">
                      <Calendar className="h-6 w-6 theme-text-muted" />
                      <div>
                        <div className="text-sm theme-text-muted font-medium">Ödeme tarihi</div>
                        <div className="text-lg font-bold theme-text">{formatDate(check.paymentDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex flex-col space-y-3 ml-6">
                  <button
                    onClick={() => onEdit(check)}
                    className="p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
                    title="Düzenle"
                  >
                    <Edit2 className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => onDelete(check.id)}
                    className="p-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                    title="Sil"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Liste Boşsa */}
      {filteredChecks.length === 0 && checks.length > 0 && (
        <div className="theme-surface rounded-2xl shadow-xl p-12 text-center border-2 theme-border">
          <div className="w-24 h-24 theme-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-12 w-12 theme-text-muted" />
          </div>
          <h3 className="text-2xl font-bold theme-text mb-4">Arama Sonucu Bulunamadı 🔍</h3>
          <p className="theme-text-muted text-lg">
            "{searchTerm}" aramanız için uygun ödeme bulunamadı.<br/>
            Farklı anahtar kelimeler deneyin veya filtreleri değiştirin.
          </p>
        </div>
      )}
    </div>
  );
}