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

        // Önce Electron AppData'dan kontrol et
        if (window.electronAPI?.loadAppData) {
          const appDataValue = await window.electronAPI.loadAppData(key);
          if (appDataValue !== null) {
            value = appDataValue;
          }
        }

        // AppData'da yoksa localStorage'dan kontrol et
        if (value === initialValue) {
          const localValue = window.localStorage.getItem(key);
          if (localValue) {
            value = JSON.parse(localValue);
            
            // Electron'daysa AppData'ya da kaydet
            if (window.electronAPI?.saveAppData) {
              await window.electronAPI.saveAppData(key, value);
            }
          }
        }

        setStoredValue(value);
        setIsLoaded(true);
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

      // localStorage'a kaydet
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // Electron AppData'ya da kaydet
      if (window.electronAPI?.saveAppData) {
        await window.electronAPI.saveAppData(key, valueToStore);
      }
    } catch (error) {
      console.error(`Error setting data for key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoaded] as const;
}