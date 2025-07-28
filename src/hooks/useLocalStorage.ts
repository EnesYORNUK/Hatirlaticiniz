import { useState, useEffect } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      saveAppData: (key: string, data: any) => Promise<boolean>;
      loadAppData: (key: string) => Promise<any>;
      [key: string]: any;
    };
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // İlk yükleme - hem localStorage hem AppData'dan kontrol et
  useEffect(() => {
    const loadData = async () => {
      try {
        let value = initialValue;

        // Önce localStorage'dan hızlı yükle
        try {
          const localValue = window.localStorage.getItem(key);
          if (localValue) {
            value = JSON.parse(localValue);
          }
        } catch (error) {
          console.error('localStorage okuma hatası:', error);
        }

        // Önce localStorage değeriyle state'i güncelle
        setStoredValue(value);
        setIsLoaded(true);

        // Sonra Electron AppData'dan kontrol et (arka planda)
        if (window.electronAPI?.loadAppData) {
          try {
            const appDataValue = await Promise.race([
              window.electronAPI.loadAppData(key),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
            ]);
            
            if (appDataValue !== null && JSON.stringify(appDataValue) !== JSON.stringify(value)) {
              setStoredValue(appDataValue);
              // localStorage'ı da güncelle
              window.localStorage.setItem(key, JSON.stringify(appDataValue));
            }
          } catch (error) {
            console.log('AppData yüklenemedi, localStorage kullanılıyor:', error.message);
          }
        }

      } catch (error) {
        console.error(`Error loading data for key "${key}":`, error);
        setStoredValue(initialValue);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [key, initialValue]);

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      // localStorage'a kaydet (senkron)
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('localStorage kaydetme hatası:', error);
      }

      // Electron AppData'ya da kaydet (asenkron, hata olursa devam et)
      if (window.electronAPI?.saveAppData) {
        try {
          await Promise.race([
            window.electronAPI.saveAppData(key, valueToStore),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
        } catch (error) {
          console.log('AppData kaydetme hatası (localStorage kaydedildi):', error.message);
        }
      }
    } catch (error) {
      console.error(`Error setting data for key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoaded] as const;
}