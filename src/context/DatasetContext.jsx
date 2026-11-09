import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const { token, currentUser } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [activeDatasetId, setActiveDatasetIdState] = useState(() => {
    const saved = localStorage.getItem('clinova_active_dataset_id');
    return saved ? parseInt(saved, 10) : null;
  });

  const refreshDatasets = useCallback(async () => {
    setLoadingDatasets(true);
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/datasets', { headers });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let list = [];
        if (contentType.includes('application/json')) {
          try {
            const data = await res.json();
            list = data.datasets || [];
          } catch (e) {
            console.warn('Dataset list JSON parse error:', e);
          }
        }
        setDatasets(list);

        // If no active dataset or current active is not in list, auto-select first available
        if (list.length > 0) {
          setActiveDatasetIdState((prevId) => {
            const exists = list.some((d) => d.id === prevId);
            const nextId = exists ? prevId : list[0].id;
            localStorage.setItem('clinova_active_dataset_id', String(nextId));
            return nextId;
          });
        } else {
          setActiveDatasetIdState(null);
          localStorage.removeItem('clinova_active_dataset_id');
        }
      }
    } catch (err) {
      console.warn('Failed to load datasets:', err);
    } finally {
      setLoadingDatasets(false);
    }
  }, [token]);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets, currentUser?.id]);

  const setActiveDatasetId = (id) => {
    const numId = id ? parseInt(id, 10) : null;
    setActiveDatasetIdState(numId);
    if (numId) {
      localStorage.setItem('clinova_active_dataset_id', String(numId));
    } else {
      localStorage.removeItem('clinova_active_dataset_id');
    }
  };

  const deleteDataset = async (id) => {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/datasets/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        await refreshDatasets();
        return { success: true };
      } else {
        let errMessage = `Failed to delete dataset (HTTP ${res.status}).`;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const err = await res.json();
            errMessage = err.error || err.message || errMessage;
          } catch {}
        } else {
          const txt = await res.text();
          if (txt && txt.trim().length > 0) {
            errMessage = `Server error (${res.status}): ${txt.slice(0, 100)}`;
          }
        }
        return { success: false, error: errMessage };
      }
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || null;

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        activeDataset,
        activeDatasetId,
        setActiveDatasetId,
        refreshDatasets,
        deleteDataset,
        loadingDatasets,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return ctx;
}

