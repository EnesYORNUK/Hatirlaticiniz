import { useState } from 'react';

// Veri yedekleme ve recovery sistemi
const BACKUP_PREFIX = 'backup_';
const MAX_BACKUPS = 5;

// localStorage veri korunma sistemi
const createBackup = (key: string, data: any) => {
  try {
    const timestamp = new Date().toISOString();
    const backupKey = `${BACKUP_PREFIX}${key}_${timestamp}`;
    window.localStorage.setItem(backupKey, JSON.stringify({
      data,
      timestamp,
      version: '1.0'
    }));

    // Eski yedekleri temizle (sadece son 5'i sakla)
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys
      .filter(k => k.startsWith(`${BACKUP_PREFIX}${key}_`))
      .sort()
      .reverse();

    // Fazla yedekleri sil
    if (backupKeys.length > MAX_BACKUPS) {
      backupKeys.slice(MAX_BACKUPS).forEach(oldKey => {
        localStorage.removeItem(oldKey);
      });
    }
  } catch (error) {
    console.warn('Backup oluşturulamadı:', error);
  }
};

// Son backup'ı geri yükle
const restoreFromBackup = (key: string) => {
  try {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys
      .filter(k => k.startsWith(`${BACKUP_PREFIX}${key}_`))
      .sort()
      .reverse();

    if (backupKeys.length > 0) {
      const latestBackup = localStorage.getItem(backupKeys[0]);
      if (latestBackup) {
        const backup = JSON.parse(latestBackup);
        console.log(`🔄 ${key} için backup'tan veri geri yüklendi:`, backup.timestamp);
        return backup.data;
      }
    }
  } catch (error) {
    console.error('Backup geri yüklenemedi:', error);
  }
  return null;
};

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        console.log(`✅ ${key} localStorage'dan yüklendi`);
        return parsed;
      } else {
        console.log(`🆕 ${key} için initial value kullanılıyor`);
        return initialValue;
      }
    } catch (error) {
      console.error(`❌ localStorage key "${key}" okunamadı:`, error);
      
      // Backup'tan geri yükle
      const backupData = restoreFromBackup(key);
      if (backupData !== null) {
        return backupData;
      }
      
      console.log(`🔄 ${key} için fallback initial value kullanılıyor`);
      return initialValue;
    }
  });

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Önce yedek oluştur
      createBackup(key, storedValue);
      
      // State'i güncelle
      setStoredValue(valueToStore);
      
      // localStorage'a kaydet
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      console.log(`💾 ${key} localStorage'a kaydedildi`);
      
      // Electron AppData'ya da kaydet (eğer mevcut ise)
      if (window.electronAPI?.saveAppData) {
        try {
          await window.electronAPI.saveAppData(key, valueToStore);
          console.log(`☁️ ${key} AppData'ya kaydedildi`);
        } catch (electronError) {
          console.warn('AppData kaydetme hatası:', electronError);
          // AppData hatası critical değil, localStorage yeterli
        }
      }
      
    } catch (error) {
      console.error(`❌ localStorage key "${key}" kaydedilemedi:`, error);
      
      // Hata durumunda değeri revert et
      console.log(`🔄 ${key} önceki değerine geri döndürülüyor`);
      
      // Storage quota hatası durumunda
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage doldu, eski veriler temizleniyor...');
        try {
          // Eski backup'ları temizle
          const allKeys = Object.keys(localStorage);
          const oldBackups = allKeys
            .filter(k => k.startsWith(BACKUP_PREFIX))
            .slice(10); // Sadece çok eskilerini sil
          
          oldBackups.forEach(oldKey => localStorage.removeItem(oldKey));
          
          // Tekrar dene
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          setStoredValue(valueToStore);
          console.log(`✅ ${key} temizlik sonrası kaydedildi`);
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw new Error(`Veri kaydedilemedi: ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  };

  // Veri bütünlüğü kontrolü
  const validateData = () => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        JSON.parse(item); // Parse test
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Recovery function
  const recoverData = () => {
    const backupData = restoreFromBackup(key);
    if (backupData !== null) {
      setStoredValue(backupData);
      // localStorage'a da geri yükle
      try {
        window.localStorage.setItem(key, JSON.stringify(backupData));
        console.log(`🔄 ${key} başarıyla geri yüklendi`);
        return true;
      } catch (error) {
        console.error('Recovery save failed:', error);
      }
    }
    return false;
  };

  return [storedValue, setValue, { validateData, recoverData }] as const;
}