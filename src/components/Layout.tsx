import React from 'react';
import { LayoutGrid, Plus, Settings, List } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const menuItems = [
    { 
      id: 'list', 
      label: '📋 ÖDEMELERİM', 
      subtitle: 'Tüm çek ve faturaları gör',
      icon: List 
    },
    { 
      id: 'add', 
      label: '➕ YENİ EKLE', 
      subtitle: 'Çek veya fatura ekle',
      icon: Plus 
    },
    { 
      id: 'settings', 
      label: '⚙️ AYARLAR', 
      subtitle: 'Bildirimler ve diğer ayarlar',
      icon: Settings 
    },
  ];

  return (
    <div className="theme-bg min-h-screen">
      {/* Ana Başlık */}
      <header className="theme-surface shadow-lg border-b-4 theme-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="theme-primary rounded-xl p-3 shadow-lg">
              <LayoutGrid className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="theme-text text-3xl font-bold">Hatırlatıcınım</h1>
              <p className="theme-text-muted text-lg">Çek ve Fatura Takip Programı</p>
            </div>
          </div>
        </div>
      </header>

      {/* Ana Menü - Büyük Butonlar */}
      <nav className="theme-bg-secondary shadow-md border-b-2 theme-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`p-6 rounded-xl border-3 transition-all duration-200 text-left ${
                    isActive
                      ? 'theme-primary text-white shadow-xl transform scale-105 border-blue-600'
                      : 'theme-surface theme-border theme-text hover:theme-bg-secondary hover:shadow-lg hover:scale-102'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'theme-text'}`} />
                    <div>
                      <div className={`text-xl font-bold ${isActive ? 'text-white' : 'theme-text'}`}>
                        {item.label}
                      </div>
                      <div className={`text-sm ${isActive ? 'text-blue-100' : 'theme-text-muted'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="mt-2 text-blue-100 text-sm font-medium">
                      ← Şu anda buradaysınız
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Ana İçerik */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Alt Bilgi */}
      <footer className="theme-bg-secondary border-t theme-border mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4 text-center">
          <p className="theme-text-muted text-sm">
            💡 <strong>İpucu:</strong> Üst menüden istediğiniz bölüme geçebilirsiniz
          </p>
        </div>
      </footer>
    </div>
  );
}