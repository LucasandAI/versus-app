// Global type fixes for react-i18next type pollution
declare global {
  namespace React {
    // Override the problematic react-i18next types to be compatible with ReactNode
    type ReactI18NextChildren = ReactNode;
    interface ReactI18NextChildren extends ReactNode {}
  }
}

// Also declare it at module level to catch any remaining references
declare module 'react' {
  type ReactI18NextChildren = ReactNode;
  interface ReactI18NextChildren extends ReactNode {}
}

// Export to ensure this file is treated as a module
export {};