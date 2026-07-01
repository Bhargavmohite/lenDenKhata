import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export default function useSafeDatabase() {
  const db = useSQLiteContext();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Database context is not available');
      console.error('Database context is not available');
      return;
    }

    try {
      setIsReady(true);
      setError(null);
    } catch (err) {
      setError(String(err));
      console.error('Database initialization error:', err);
    }
  }, [db]);

  if (!db) {
    return null;
  }

  return db;
}
