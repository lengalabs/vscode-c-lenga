import { DebugContext } from "./debugContext";

interface DebugProviderProps {
  debug: boolean;
  children: React.ReactNode;
}

export default function DebugProvider({ debug, children }: DebugProviderProps) {
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
