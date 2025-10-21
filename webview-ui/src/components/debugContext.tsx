/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";

export interface DebugContextType {
  debug: boolean;
}

export const DebugContext = createContext<DebugContextType | null>(null);

export function useDebugContext(): DebugContextType {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error("DebugContext must be used inside a provider");
  return ctx;
}
interface DebugProviderProps {
  debug: boolean;
  children: React.ReactNode;
}

export function DebugProvider({ debug, children }: DebugProviderProps) {
  return (
    <DebugContext.Provider
      value={{
        debug,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}
