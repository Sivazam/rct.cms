'use client';

import { useState, useEffect, useCallback } from 'react';

type LoadingSource = 'initial' | 'page' | 'image' | 'api' | 'transition';

interface LoadingState {
  isLoading: boolean;
  sources: Set<LoadingSource>;
  progress: number;
}

class GlobalLoaderManager {
  private listeners: Set<(state: LoadingState) => void> = new Set();
  private state: LoadingState = {
    isLoading: false,
    sources: new Set(),
    progress: 0
  };

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private updateProgress() {
    const sourceCount = this.state.sources.size;
    if (sourceCount === 0) {
      this.state.progress = 100;
    } else {
      // Calculate progress based on number of active sources
      this.state.progress = Math.max(0, 100 - (sourceCount * 20));
    }
  }

  show(source: LoadingSource) {
    this.state.sources.add(source);
    this.state.isLoading = true;
    this.updateProgress();
    this.notify();
  }

  hide(source: LoadingSource) {
    this.state.sources.delete(source);
    this.updateProgress();
    
    if (this.state.sources.size === 0) {
      this.state.isLoading = false;
      this.state.progress = 100;
      
      // Reset after a short delay
      setTimeout(() => {
        if (this.state.sources.size === 0) {
          this.state.progress = 0;
          this.notify();
        }
      }, 300);
    }
    this.notify();
  }

  getState(): LoadingState {
    return { ...this.state };
  }

  subscribe(listener: (state: LoadingState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Static methods for direct access without hook
  static show(source: LoadingSource = 'api') {
    globalLoaderManager.show(source);
  }

  static hide(source: LoadingSource = 'api') {
    globalLoaderManager.hide(source);
  }

  static withLoader<T>(promise: Promise<T>, source: LoadingSource = 'api'): Promise<T> {
    globalLoaderManager.show(source);
    return promise.finally(() => {
      globalLoaderManager.hide(source);
    });
  }
}

// Global singleton instance
export const globalLoaderManager = new GlobalLoaderManager();

export function useGlobalLoader() {
  const [state, setState] = useState<LoadingState>(globalLoaderManager.getState());

  useEffect(() => {
    return globalLoaderManager.subscribe(setState);
  }, []);

  const showLoader = useCallback((source: LoadingSource = 'api') => {
    globalLoaderManager.show(source);
  }, []);

  const hideLoader = useCallback((source: LoadingSource = 'api') => {
    globalLoaderManager.hide(source);
  }, []);

  const withLoader = useCallback(async <T,>(
    promise: Promise<T>,
    source: LoadingSource = 'api'
  ): Promise<T> => {
    showLoader(source);
    try {
      const result = await promise;
      return result;
    } finally {
      hideLoader(source);
    }
  }, [showLoader, hideLoader]);

  return {
    isLoading: state.isLoading,
    progress: state.progress,
    showLoader,
    hideLoader,
    withLoader
  };
}