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
      label: 'Ödemelerim', 
      icon: List,
      description: 'Tüm çek ve faturaları görüntüle'
    },
    { 
      id: 'add', 
      label: 'Yeni Ekle', 
      icon: Plus,
      description: 'Çek veya fatura ekle'
    },
    { 
      id: 'settings', 
      label: 'Ayarlar', 
      icon: Settings,
      description: 'Uygulama ayarları'
    },
  ];

  return (
    <div className="theme-bg min-h-screen">
      {/* Modern Header */}
      <header className="theme-surface shadow-sm border-b theme-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="theme-primary rounded-lg p-2.5 shadow-sm">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="theme-text text-lg font-semibold">Hatırlatıcınım</h1>
              <p className="theme-text-muted text-sm">Çek ve Fatura Takip</p>
            </div>
          </div>
        </div>
      </header>

      {/* Compact Navigation */}
      <nav className="theme-bg-secondary border-b theme-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                    isActive
                      ? 'border-current theme-primary text-white bg-opacity-10'
                      : 'border-transparent theme-text-secondary hover:theme-text hover:bg-white hover:bg-opacity-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Clean Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}