import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic?: "AND" | "OR";
}

interface Policy {
  id: string;
  name: string;
  rules: Rule[];
  requireFirstName: boolean;
  requireLastName: boolean;
  createdAt: string;
}

interface PolicyContextType {
  policies: Policy[];
  setPolicies: React.Dispatch<React.SetStateAction<Policy[]>>;
}

const PolicyContext = createContext<PolicyContextType | undefined>(undefined);

export const PolicyProvider = ({ children }: { children: ReactNode }) => {
  const [policies, setPolicies] = useState<Policy[]>(() => {
    const saved = localStorage.getItem("policies");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            name: "MiCA Compliance Policy",
            rules: [
              {
                id: "r1",
                field: "Age",
                operator: "≥",
                value: "18",
                logic: "AND",
              },
              {
                id: "r2",
                field: "Country",
                operator: "=",
                value: "EU Member State",
              },
            ],
            requireFirstName: true,
            requireLastName: true,
            createdAt: new Date().toISOString(),
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem("policies", JSON.stringify(policies));
  }, [policies]);

  return (
    <PolicyContext.Provider value={{ policies, setPolicies }}>
      {children}
    </PolicyContext.Provider>
  );
};

export const usePolicies = () => {
  const context = useContext(PolicyContext);
  if (!context)
    throw new Error("usePolicies must be used within PolicyProvider");
  return context;
};
