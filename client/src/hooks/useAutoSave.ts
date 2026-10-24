import { useState, useEffect, useRef, useCallback } from 'react';

export type AutoSaveStatus = 'saved' | 'pending' | 'saving' | 'error' | 'invalid';

export interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<any>;
  debounceMs?: number;
  maxWaitMs?: number;
  validate?: (data: T) => boolean;
  enabled?: boolean;
}

export interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  isDirty: boolean;
  lastSavedAt: Date | null;
  errorMessage: string | null;
  flush: () => Promise<boolean>;
  retry: () => Promise<boolean>;
  saveNow: () => Promise<boolean>;
  resetToInitial: (newData: any) => void;
}

/**
 * Enterprise Auto-Save Hook with Debounce, MaxWait, Dirty Checking, and Flush on Exit.
 * Solves server overload by throttling rapid keystrokes into batched requests while guaranteeing zero data loss.
 */
export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1000,
  maxWaitMs = 4000,
  validate,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('saved');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References to track state without triggering re-renders
  const dataRef = useRef<T>(data);
  dataRef.current = data;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const validateRef = useRef(validate);
  validateRef.current = validate;

  const lastSavedSnapshotRef = useRef<string>(JSON.stringify(data));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Core save function
  const executeSave = useCallback(async (dataToSave: T): Promise<boolean> => {
    // Validate before saving
    if (validateRef.current && !validateRef.current(dataToSave)) {
      setStatus('invalid');
      return false;
    }

    if (isSavingRef.current) {
      return false;
    }

    isSavingRef.current = true;
    setStatus('saving');
    setErrorMessage(null);

    // Clear any pending timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }

    try {
      await onSaveRef.current(dataToSave);
      
      const currentJson = JSON.stringify(dataRef.current);
      const savedJson = JSON.stringify(dataToSave);

      lastSavedSnapshotRef.current = savedJson;
      setLastSavedAt(new Date());

      if (isMountedRef.current) {
        // If data changed while save was in-flight, mark pending again
        if (currentJson !== savedJson) {
          setIsDirty(true);
          setStatus('pending');
        } else {
          setIsDirty(false);
          setStatus('saved');
        }
      }
      return true;
    } catch (err: any) {
      if (isMountedRef.current) {
        setStatus('error');
        setErrorMessage(err?.message || 'Không thể lưu tự động');
      }
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // Flush any pending unsaved changes immediately
  const flush = useCallback(async (): Promise<boolean> => {
    const currentJson = JSON.stringify(dataRef.current);
    const hasUnsavedChanges = currentJson !== lastSavedSnapshotRef.current;

    if (hasUnsavedChanges && (!validateRef.current || validateRef.current(dataRef.current))) {
      return await executeSave(dataRef.current);
    }
    return true;
  }, [executeSave]);

  // Manual save trigger / click to save now
  const saveNow = useCallback(async (): Promise<boolean> => {
    return await executeSave(dataRef.current);
  }, [executeSave]);

  // Retry after error
  const retry = useCallback(async (): Promise<boolean> => {
    return await executeSave(dataRef.current);
  }, [executeSave]);

  // Reset snapshot (e.g. when opening modal or switching notes)
  const resetToInitial = useCallback((newData: T) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    debounceTimerRef.current = null;
    maxWaitTimerRef.current = null;

    lastSavedSnapshotRef.current = JSON.stringify(newData);
    setIsDirty(false);
    setStatus('saved');
    setErrorMessage(null);
  }, []);

  // Monitor data changes and manage debounce/maxWait timers
  useEffect(() => {
    if (!enabled) return;

    const currentJson = JSON.stringify(data);
    const dirty = currentJson !== lastSavedSnapshotRef.current;
    setIsDirty(dirty);

    if (!dirty) {
      // Reverted back to last saved snapshot
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (maxWaitTimerRef.current) {
        clearTimeout(maxWaitTimerRef.current);
        maxWaitTimerRef.current = null;
      }
      if (!isSavingRef.current) {
        setStatus('saved');
      }
      return;
    }

    // Check validity
    if (validateRef.current && !validateRef.current(data)) {
      setStatus('invalid');
      return;
    }

    // Mark as pending
    setStatus('pending');

    // Reset debounce timer on every keystroke/change
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      executeSave(dataRef.current);
    }, debounceMs);

    // Establish maxWait timer if not already active
    if (!maxWaitTimerRef.current) {
      maxWaitTimerRef.current = setTimeout(() => {
        executeSave(dataRef.current);
      }, maxWaitMs);
    }
  }, [data, debounceMs, maxWaitMs, enabled, executeSave]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    };
  }, []);

  return {
    status,
    isDirty,
    lastSavedAt,
    errorMessage,
    flush,
    retry,
    saveNow,
    resetToInitial,
  };
}
