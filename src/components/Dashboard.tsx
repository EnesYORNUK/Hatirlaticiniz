import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Pill, 
  Calendar, 
  ArrowRight,
  Wallet,
  Clock
} from 'lucide-react';
import { useSupabaseChecks } from '../hooks/useSupabaseChecks';
import { useSupabaseMedications } from '../hooks/useSupabaseMedications';
import { formatCurrency } from '../utils/accountUtils';
import { formatDate } from '../utils/dateUtils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { checks, isLoading: checksLoading } = useSupabaseChecks();
  const { getDailySchedule, isLoading: medsLoading, markMedicationTaken } = useSupabaseMedications();

  // Finansal Özet Hesaplamaları
  const financialStats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const unpaidChecks = checks.filter(c => !c.isPaid);
    const totalDebt = unpaidChecks.reduce((sum, c) => sum + Number(c.amount), 0);
    
    const thisMonthChecks = unpaidChecks.filter(c => {
      const d = new Date(c.paymentDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    const monthlyDebt = thisMonthChecks.reduce((sum, c) => sum + Number(c.amount), 0);
    
    const overdueChecks = unpaidChecks.filter(c => new Date(c.paymentDate) < today);
    const overdueCount = overdueChecks.length;

    return { totalDebt, monthlyDebt, overdueCount, overdueChecks };
  }, [checks]);

  // Bugünün İlaçları
  const todaysMeds = useMemo(() => {
    return getDailySchedule(new Date());
  }, [getDailySchedule]);

  if (checksLoading || medsLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Üst Bilgi Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Toplam Borç */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
              <Wallet className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Toplam Borç</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(financialStats.totalDebt)}
          </h3>
          <p className="text-sm text-slate-500 mt-1">Ödenmemiş tüm çekler</p>
        </div>

        {/* Bu Ay Ödenecek */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Bu Ay Ödenecek</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(financialStats.monthlyDebt)}
          </h3>
          <p className="text-sm text-slate-500 mt-1">Ocak ayı planı</p>
        </div>

        {/* Gecikmiş Ödemeler */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Gecikmiş</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {financialStats.overdueCount} Adet
          </h3>
          <p className="text-sm text-slate-500 mt-1">Acil ödeme bekliyor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sol Sütun: Yaklaşan Ödemeler */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-indigo-600" />
              Yaklaşan Ödemeler
            </h2>
            <button 
              onClick={() => navigate('/checks')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {financialStats.overdueChecks.length > 0 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-900/20">
                <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">Gecikmiş Ödemeleriniz Var!</h4>
                <div className="space-y-2">
                  {financialStats.overdueChecks.slice(0, 2).map(check => (
                    <div key={check.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{check.signedTo}</span>
                      <span className="font-bold text-orange-600">{formatCurrency(check.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {checks.filter(c => !c.isPaid).slice(0, 5).map((check) => (
                <div key={check.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                      {check.type === 'check' ? '🧾' : '⚡'}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{check.signedTo}</h4>
                      <p className="text-xs text-slate-500">{formatDate(check.paymentDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(check.amount)}</p>
                    <span className="text-xs text-slate-500">{check.type === 'check' ? 'Çek' : 'Fatura'}</span>
                  </div>
                </div>
              ))}
              {checks.filter(c => !c.isPaid).length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  Ödenecek borcunuz bulunmuyor. Harika! 🎉
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Sütun: İlaç Programı */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" />
              Bugünkü İlaç Programı
            </h2>
            <button 
              onClick={() => navigate('/medications')}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              İlaçlarım <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-teal-50/50 dark:bg-teal-900/10">
              <div className="flex items-center justify-between text-sm text-teal-800 dark:text-teal-300">
                <span>İlerleme Durumu</span>
                <span className="font-bold">
                  {todaysMeds.filter(m => m.status === 'taken').length} / {todaysMeds.length}
                </span>
              </div>
              <div className="mt-2 h-2 bg-teal-100 dark:bg-teal-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${(todaysMeds.filter(m => m.status === 'taken').length / (todaysMeds.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
              {todaysMeds.map((item) => (
                <div key={`${item.medication.id}-${item.scheduledTime}`} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${
                      item.status === 'taken' ? 'bg-teal-500' : 
                      item.status === 'missed' ? 'bg-red-400' : 'bg-slate-200 dark:bg-slate-600'
                    }`} />
                    <div>
                      <h4 className={`font-medium ${item.status === 'taken' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {item.medication.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {item.scheduledTime} • {item.medication.dosage}
                      </div>
                    </div>
                  </div>
                  
                  {item.status !== 'taken' && (
                    <button
                      onClick={() => markMedicationTaken(item.medication.id, item.scheduledTime, 'taken')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200"
                    >
                      İçildi İşaretle
                    </button>
                  )}
                  {item.status === 'taken' && (
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                  )}
                </div>
              ))}
              {todaysMeds.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  Bugün için planlanmış ilaç yok.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
