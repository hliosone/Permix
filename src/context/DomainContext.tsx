import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface TradingPair {
  base: string;
  quote: string;
}

interface Domain {
  id: string;
  domainId: string;
  policyName: string;
  tradingPairs: TradingPair[];
  hybridOffers: boolean;
  createdAt: string;
  stats: {
    users: number;
    volume24h: string;
    trades: number;
  };
}

interface DomainContextType {
  domains: Domain[];
  setDomains: React.Dispatch<React.SetStateAction<Domain[]>>;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export const DomainProvider = ({ children }: { children: ReactNode }) => {
  const [domains, setDomains] = useState<Domain[]>(() => {
    const saved = localStorage.getItem("domains");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            domainId: "DOM-7F3E9A2B",
            policyName: "MiCA Compliance Policy",
            tradingPairs: [],
            hybridOffers: false,
            createdAt: new Date().toISOString(),
            stats: {
              users: 127,
              volume24h: "€234,567",
              trades: 1843,
            },
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem("domains", JSON.stringify(domains));
  }, [domains]);

  return (
    <DomainContext.Provider value={{ domains, setDomains }}>
      {children}
    </DomainContext.Provider>
  );
};

export const useDomains = () => {
  const context = useContext(DomainContext);
  if (!context)
    throw new Error("useDomains must be used within DomainProvider");
  return context;
};
