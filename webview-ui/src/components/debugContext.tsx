import { DebugContext } from "../lib/debugContext";

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
