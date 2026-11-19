import { useEffect, useState } from 'react';
import { getJson } from './client.js';

export type ApiDataState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

export function useApiData<T>(path: string, resourceName: string): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getJson<T>(path)
      .then((data) => {
        if (active) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const detail = error instanceof Error ? error.message : 'An unexpected error occurred.';
        setState({ status: 'error', message: `Unable to load ${resourceName}: ${detail}` });
      });

    return () => {
      active = false;
    };
  }, [path, resourceName]);

  return state;
}
