
const storageService = {
  // Save data to localStorage
  setItem: (key: string, value: unknown): void => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error saving "${key}" to localStorage:`, error);
    }
  },

  // Get data from localStorage with generic type support
  getItem: <T>(key: string): T | null => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error reading "${key}" from localStorage:`, error);
      return null;
    }
  },

  // Remove item from localStorage
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing "${key}" from localStorage:`, error);
    }
  },

  // Clear all localStorage
  clearAll: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },
};

export default storageService;