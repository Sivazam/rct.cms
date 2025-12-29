import { globalLoaderManager } from '@/hooks/useGlobalLoader';

// Enhanced fetch function without automatic loading management for API calls
export async function fetchWithLoader<T>(
  url: string,
  options?: RequestInit,
  loadingSource = 'api'
): Promise<T> {
  // Note: API calls no longer trigger global loader per requirements
  return fetch(url, options).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });
}

// Hook for API calls without automatic loading management
export function useApiWithLoader() {
  const get = async <T>(url: string): Promise<T> => {
    // Note: API calls no longer trigger global loader per requirements
    return fetch(url).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  };

  const post = async <T>(url: string, data?: any): Promise<T> => {
    // Note: API calls no longer trigger global loader per requirements
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  };

  const put = async <T>(url: string, data?: any): Promise<T> => {
    // Note: API calls no longer trigger global loader per requirements
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  };

  const del = async <T>(url: string): Promise<T> => {
    // Note: API calls no longer trigger global loader per requirements
    return fetch(url, {
      method: 'DELETE',
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  };

  return { get, post, put, delete: del };
}