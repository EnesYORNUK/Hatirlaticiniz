import React from 'react';
import { AlertCircle, Download, Upload, CheckCircle, Loader, X } from 'lucide-react';

interface MigrationPromptProps {
  migrationStatus: {
    isNeeded: boolean;
    isRunning: boolean;
    isComplete: boolean;
    error: string | null;
    progress: string;
  };
  onRunMigration: () => Promise<boolean>;
  onSkipMigration: () => void;
}

export default function MigrationPrompt({ 
  migrationStatus, 
  onRunMigration, 
  onSkipMigration 
}: MigrationPromptProps) {
  // Don't show if migration is not needed or already complete
  if (!migrationStatus.isNeeded || migrationStatus.isComplete) {
    return null;
  }

  const handleMigrate = async () => {
    await onRunMigration();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 rounded-lg p-2">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Veri Taşıma İşlemi
            </h2>
            <p className="text-sm text-gray-600">
              Supabase'e geçiş yapılıyor
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">
                  Yerel Veriler Bulundu
                </h3>
                <p className="text-sm text-yellow-700">
                  Bilgisayarınızda kayıtlı çek, ilaç ve ayar verileriniz bulundu. 
                  Bu veriler Supabase'e taşınarak tüm cihazlarınızda senkronize hale gelecek.
                </p>
              </div>
            </div>
          </div>

          {migrationStatus.isRunning && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <h3 className="font-medium text-blue-800">
                    Veriler Taşınıyor...
                  </h3>
                  <p className="text-sm text-blue-700">
                    {migrationStatus.progress}
                  </p>
                </div>
              </div>
            </div>
          )}

          {migrationStatus.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">
                    Hata Oluştu
                  </h3>
                  <p className="text-sm text-red-700">
                    {migrationStatus.error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium text-gray-800">Taşınacak veriler:</h4>
            <ul className="space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Çek ve fatura kayıtları
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                İlaç programları ve logları
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Uygulama ayarları
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleMigrate}
            disabled={migrationStatus.isRunning}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center justify-center gap-2"
          >
            {migrationStatus.isRunning ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Taşınıyor...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Verileri Taşı
              </>
            )}
          </button>
          
          <button
            onClick={onSkipMigration}
            disabled={migrationStatus.isRunning}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg 
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            Atla
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>
            ⚠️ Veriler taşındıktan sonra yerel kopyalar silinecektir. 
            Bu işlem geri alınamaz.
          </p>
        </div>
      </div>
    </div>
  );
}