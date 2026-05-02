import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';

export function useList(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const listRef = ref(db, path);
    const unsubscribe = onValue(listRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // Realtime DB usually returns an object of objects
        const results = Object.entries(val).map(([id, data]) => ({
          id,
          ...data
        }));
        setData(results);
      } else {
        setData([]);
      }
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}

export function useObject(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) return;
    const objRef = ref(db, path);
    const unsubscribe = onValue(objRef, (snapshot) => {
      setData(snapshot.val());
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}
