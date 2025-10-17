// src/hooks/useUndoRedo.ts
import { useState, useCallback } from 'react';

interface UseUndoRedoReturn<T> {
    state: T;
    setState: (newState: T) => void;
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;
    canUndo: boolean;
    canRedo: boolean;
    history: {
        past: T[];
        present: T;
        future: T[];
    };
}

export const useUndoRedo = <T>(
    initialState: T,
    maxHistory: number = 100
): UseUndoRedoReturn<T> => {
    const [history, setHistory] = useState({
        past: [] as T[],
        present: initialState,
        future: [] as T[],
    });

    const setState = useCallback((newState: T) => {
        setHistory(prev => ({
            past: [...prev.past.slice(-maxHistory), prev.present],
            present: newState,
            future: [],
        }));
    }, [maxHistory]);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const previous = prev.past[prev.past.length - 1];
            const newPast = prev.past.slice(0, prev.past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [prev.present, ...prev.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const next = prev.future[0];
            const newFuture = prev.future.slice(1);

            return {
                past: [...prev.past, prev.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory({
            past: [],
            present: history.present,
            future: [],
        });
    }, [history.present]);

    return {
        state: history.present,
        setState,
        undo,
        redo,
        clearHistory,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        history,
    };
};