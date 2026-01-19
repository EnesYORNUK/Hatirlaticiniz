import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  AlertCircle, 
  CheckCircle, 
  Pill, 
  Wallet,
  CreditCard
} from 'lucide-react';
import { useSupabaseChecks } from '../hooks/useSupabaseChecks';
import { useSupabaseMedications } from '../hooks/useSupabaseMedications';
import { formatCurrency } from '../utils/accountUtils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { checks, isLoading: checksLoading } = useSupabaseChecks();
  const { getDailySchedule, isLoading: medsLoading } = useSupabaseMedications();

  // Finansal Özet Hesaplamaları
  const financialStats = useMemo(() => {
    const today = new Date();
    const unpaidChecks = checks.filter(c => !c.isPaid);
    const totalDebt = unpaidChecks.reduce((sum, c) => sum + Number(c.amount), 0);
    const overdueChecks = unpaidChecks.filter(c => new Date(c.paymentDate) < today);
    const overdueCount = overdueChecks.length;

    return { totalDebt, overdueCount, overdueChecks };
  }, [checks]);

  // Bugünün İlaçları
  const todaysMeds = useMemo(() => {
    return getDailySchedule(new Date());
  }, [getDailySchedule]);

  if (checksLoading && checks.length === 0 && medsLoading && todaysMeds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-10">
      {/* Basitleştirilmiş Karşılama Alanı */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Hoş Geldiniz</h1>
        <p className="text-slate-500 text-lg">{today}</p>
      </div>

      {/* Hızlı İşlem Butonları - Büyük ve Net */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => navigate('/add?type=check')}
          className="group relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-1">Ödeme Ekle</h3>
            <p className="text-indigo-100">Çek veya fatura girişi yap</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/add?type=medication')}
          className="group relative overflow-hidden bg-teal-600 hover:bg-teal-700 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Pill className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-1">İlaç Ekle</h3>
            <p className="text-teal-100">Yeni ilaç takibi başlat</p>
          </div>
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finansal Durum */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-500" />
              Finansal Durum
            </h3>
            <button onClick={() => navigate('/checks')} className="text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full transition-colors">
              Detaylar
            </button>
          </div>
          
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 mb-1">Toplam Ödenecek</p>
            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {formatCurrency(financialStats.totalDebt)}
            </div>
            {financialStats.overdueCount > 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                {financialStats.overdueCount} gecikmiş ödeme
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Her şey yolunda
              </div>
            )}
          </div>
        </div>

        {/* İlaç Takibi */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-500" />
              Bugünkü İlaçlar
            </h3>
            <button onClick={() => navigate('/medications')} className="text-sm font-medium text-teal-600 hover:bg-teal-50 px-3 py-1 rounded-full transition-colors">
              Liste
            </button>
          </div>

          {todaysMeds.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                <span>Tamamlanan</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {todaysMeds.filter(m => m.status === 'taken').length} / {todaysMeds.length}
                </span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${(todaysMeds.filter(m => m.status === 'taken').length / todaysMeds.length) * 100}%` }}
                />
              </div>
              <p className="text-center text-sm text-slate-500 mt-4">
                {todaysMeds.filter(m => m.status !== 'taken').length === 0 
                  ? "Tüm ilaçlarınızı aldınız! 🎉" 
                  : `${todaysMeds.filter(m => m.status !== 'taken').length} ilaç daha almanız gerekiyor.`}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Bugün için ilaç planı yok.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
