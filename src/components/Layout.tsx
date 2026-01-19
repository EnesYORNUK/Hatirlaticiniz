import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutGrid, Settings, Pill, Calendar, PlusCircle, LogOut, UserCircle, User } from 'lucide-react';
import { User as UserType } from '../types';
import logo from '../assets/logo.png';

interface LayoutProps {
  children?: React.ReactNode; // Outlet will handle rendering, but keep for flexibility
  onLogout?: () => void;
  user?: UserType | null; // Add user to props
}

export default function Layout({ 
  onLogout, 
  user, // Get user from props
}: LayoutProps) {
  const location = useLocation();

  const menuItems = [
      {
        id: '/',
        label: 'Çek & Fatura',
        icon: Calendar,
        description: 'Tüm ödemeleri yönet'
      },
      {
        id: '/medications',
        label: 'İlaç Takibi',
        icon: Pill,
        description: 'İlaçlarınızı yönetin'
      },
      {
        id: '/add',
        label: 'Hızlı Ekle',
        icon: PlusCircle,
        description: 'Yeni kayıt oluştur'
      },
      {
        id: '/profile',
        label: 'Profil',
        icon: UserCircle,
        description: 'Hesap ayarları'
      },
      {
        id: '/settings',
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
              <img
                src={logo}
                alt="Hatırlatıcınız Logo"
                className="w-8 h-8 rounded-md shadow-sm"
              />
              <div>
                <h1 className="theme-text text-lg font-semibold">Hatırlatıcınız</h1>
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
              const isActive = location.pathname === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.id}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                    isActive
                      ? 'theme-primary-border theme-primary-text'
                      : 'border-transparent theme-text-secondary hover:theme-text hover:bg-white hover:bg-opacity-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Clean Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}