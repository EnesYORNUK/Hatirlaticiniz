import React from 'react';
import { LayoutGrid, Plus, Settings, List, Palette } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const menuItems = [
    { id: 'list', label: 'Ödeme Listesi', icon: List },
    { id: 'add', label: 'Yeni Ekle', icon: Plus },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="theme-bg min-h-screen">
      {/* Header */}
      <header className="theme-surface shadow-md border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="theme-primary rounded-lg p-2">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <h1 className="theme-text text-xl font-bold">Hatırlatıcınım</h1>
            </div>
            
            {/* Tema Göstergesi */}
            <div className="flex items-center gap-2 theme-bg-secondary px-3 py-1 rounded-full">
              <Palette className="w-4 h-4 theme-text-muted" />
              <span className="theme-text-muted text-sm font-medium">
                {(() => {
                  const theme = document.documentElement.getAttribute('data-theme') || 'light';
                  const themeLabels: Record<string, string> = {
                    light: '🌅 Açık',
                    dark: '🌙 Koyu',
                    blue: '🔵 Mavi',
                    green: '🟢 Yeşil',
                    orange: '🟠 Turuncu',
                    purple: '🟣 Mor',
                    gray: '⚫ Gri',
                    red: '🔴 Kırmızı',
                    teal: '🟦 Turkuaz',
                    pink: '🌸 Pembe'
                  };
                  return themeLabels[theme] || '🌅 Açık';
                })()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="theme-bg-secondary border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3 py-4 border-b-2 transition-colors ${
                    isActive
                      ? 'border-current theme-primary text-white bg-opacity-10'
                      : 'border-transparent theme-text-secondary hover:theme-text'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}