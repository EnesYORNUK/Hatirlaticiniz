import React, { useState } from 'react';
import { User, LogOut, Trash2, AlertTriangle, Mail, Calendar, Shield, Settings as SettingsIcon } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileProps {
  user: UserType | null;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
}

export default function Profile({ user, onLogout, onDeleteAccount }: ProfileProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="theme-text-muted">Kullanıcı bilgisi bulunamadı.</p>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'HESABI SIL') {
      return;
    }

    try {
      setIsDeleting(true);
      await onDeleteAccount();
    } catch (error) {
      console.error('Account deletion failed:', error);
      alert('Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="theme-primary rounded-lg p-2.5">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold theme-text">Profil</h1>
            <p className="theme-text-muted text-sm">Hesap bilgilerinizi yönetin</p>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" />
          Hesap Bilgileri
        </h2>
        
        <div className="space-y-4">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="theme-text font-medium text-lg">{user.fullName}</h3>
              <p className="theme-text-muted text-sm flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t theme-border">
            <div className="flex items-center gap-3 p-3 theme-bg-secondary rounded-lg">
              <Calendar className="w-4 h-4 theme-text-muted" />
              <div>
                <p className="theme-text text-sm font-medium">Hesap Oluşturma</p>
                <p className="theme-text-muted text-xs">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 theme-bg-secondary rounded-lg">
              <Shield className="w-4 h-4 theme-text-muted" />
              <div>
                <p className="theme-text text-sm font-medium">Hesap Durumu</p>
                <p className="text-green-600 text-xs font-medium">Aktif</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="theme-surface rounded-lg shadow-sm border theme-border p-6">
        <h2 className="text-base font-semibold theme-text mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Hesap İşlemleri
        </h2>
        
        <div className="space-y-4">
          {/* Logout Section */}
          <div className="flex items-center justify-between p-4 border theme-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <LogOut className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="theme-text font-medium">Çıkış Yap</h3>
                <p className="theme-text-muted text-sm">Hesabınızdan güvenli şekilde çıkış yapın</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>

          {/* Delete Account Section */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-red-900 font-medium">Hesabı Sil</h3>
                <p className="text-red-700 text-sm mt-1">
                  Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hesabı Sil
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-red-900 text-sm font-medium">Dikkat!</p>
                          <p className="text-red-800 text-xs mt-1">
                            Bu işlem geri alınamaz. Tüm çekleriniz, ilaçlarınız ve ayarlarınız kalıcı olarak silinecektir.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-red-900 text-sm font-medium mb-2">
                        Onaylamak için "HESABI SIL" yazın:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="HESABI SIL"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'HESABI SIL' || isDeleting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                      >
                        {isDeleting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Siliniyor...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Hesabı Kalıcı Olarak Sil
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-900 text-sm font-medium">Gizlilik Bilgisi</p>
            <p className="text-blue-800 text-xs mt-1">
              Verileriniz güvenli şekilde şifrelenir ve sadece sizin erişebileceğiniz şekilde saklanır. 
              Hesabınızı sildiğinizde tüm veriler kalıcı olarak kaldırılır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}