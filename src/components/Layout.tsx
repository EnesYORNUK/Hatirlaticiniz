import React from 'react';
import { LayoutGrid, Plus, Settings, List, Pill, Calendar, PlusCircle, LogOut, User, UserCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  user?: UserType | null;
  onLogout?: () => void;
}

export default function Layout({ children, currentPage, onNavigate, user, onLogout }: LayoutProps) {
  const menuItems = [
    { 
      id: 'list', 
      label: 'Anasayfa', 
      icon: LayoutGrid,
      description: 'Tüm çek ve faturaları görüntüle'
    },
    { 
      id: 'daily-schedule', 
      label: 'Günlük Program', 
      icon: Calendar,
      description: 'Bugünün ilaç ve ödeme programı'
    },
    { 
      id: 'medications', 
      label: 'İlaçlarım', 
      icon: Pill,
      description: 'İlaç takip sistemi'
    },
    { 
      id: 'add', 
      label: 'Yeni Ödeme', 
      icon: Plus,
      description: 'Çek veya fatura ekle'
    },
    { 
      id: 'add-medication', 
      label: 'Yeni İlaç', 
      icon: PlusCircle,
      description: 'İlaç ekle ve program oluştur'
    },
    { 
      id: 'profile', 
      label: 'Profil', 
      icon: UserCircle,
      description: 'Hesap ayarları ve profil yönetimi'
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="theme-primary rounded-lg p-2.5 shadow-sm">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="theme-text text-lg font-semibold">Hatırlatıcınım</h1>
                <p className="theme-text-muted text-sm">Çek ve Fatura Takip</p>
              </div>
            </div>
            
            {/* User info and logout */}
            {user && onLogout && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="theme-bg-secondary rounded-lg p-2">
                    <User className="w-4 h-4 theme-text" />
                  </div>
                  <div className="text-right">
                    <p className="theme-text text-sm font-medium">{user.fullName}</p>
                    <p className="theme-text-muted text-xs">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm theme-text-muted hover:theme-text hover:bg-red-50 rounded-lg transition-colors"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış</span>
                </button>
              </div>
            )}
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