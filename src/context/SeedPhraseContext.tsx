import React, { createContext, useContext, useState } from "react";

interface SeedPhraseContextType {
  seedPhrase: string;
  setSeedPhrase: (phrase: string) => void;
}

const SeedPhraseContext = createContext<SeedPhraseContextType | undefined>(
  undefined
);

export const SeedPhraseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [seedPhrase, setSeedPhrase] = useState("");
  return (
    <SeedPhraseContext.Provider value={{ seedPhrase, setSeedPhrase }}>
      {children}
    </SeedPhraseContext.Provider>
  );
};

export const useSeedPhrase = () => {
  const context = useContext(SeedPhraseContext);
  if (!context) {
    throw new Error("useSeedPhrase must be used within a SeedPhraseProvider");
  }
  return context;
};
