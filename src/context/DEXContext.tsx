import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface TradingPair {
  base: string;
  quote: string;
}

export interface DEX {
  id: string;
  dexId: string;
  linkedDomain: string;
  tradingPairs: TradingPair[];
  createdAt: string;
}

interface DEXContextType {
  dexs: DEX[];
  setDexs: React.Dispatch<React.SetStateAction<DEX[]>>;
}

const DEXContext = createContext<DEXContextType | undefined>(undefined);

export function DEXProvider({ children }: { children: ReactNode }) {
  const [dexs, setDexs] = useState<DEX[]>([]);

  /* 🟩 1️⃣  Load saved DEXs once when the app starts */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("permix.dexs");
      if (saved) {
        setDexs(JSON.parse(saved));
      }
    } catch (err) {
      console.warn("Failed to parse saved DEXs:", err);
    }
  }, []);

  /* 🟩 2️⃣  Save DEXs automatically whenever they change */
  useEffect(() => {
    try {
      localStorage.setItem("permix.dexs", JSON.stringify(dexs));
    } catch (err) {
      console.warn("Failed to save DEXs:", err);
    }
  }, [dexs]);
  return (
    <DEXContext.Provider value={{ dexs, setDexs }}>
      {children}
    </DEXContext.Provider>
  );
}

export function useDEXs() {
  const context = useContext(DEXContext);
  if (!context) {
    throw new Error("useDEXs must be used within a DEXProvider");
  }
  return context;
}
