import { useState, useCallback } from 'react';

export function useApi(apiFunc) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunc(...args);
        const resolvedData = result?.data !== undefined ? result.data : result;
        setData(resolvedData);
        return { success: true, data: resolvedData, raw: result };
      } catch (err) {
        const errorMsg = err?.message || 'Something went wrong';
        setError(errorMsg);
        return { success: false, error: errorMsg, errors: err?.errors };
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    setData,
    reset,
  };
}

export default useApi;
