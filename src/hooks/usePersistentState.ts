import { useEffect, useState } from "react";

export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const rawValue = localStorage.getItem(key);
      if (rawValue === null) {
        return defaultValue;
      }
      return JSON.parse(rawValue) as T;
    } catch (error) {
      console.warn(`Failed to read localStorage key "${key}". Using default.`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save localStorage key "${key}".`, error);
    }
  }, [key, state]);

  return [state, setState];
}
