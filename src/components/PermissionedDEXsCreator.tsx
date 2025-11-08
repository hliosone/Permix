import { useState } from "react";
import { TrendingUp, Plus, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";
import { useDEXs } from "../context/DEXContext";
import { useDomains } from "../context/DomainContext";



interface TradingPair {
  base: string;
  quote: string;
}

interface DEX {
  id: string;
  dexId: string;
  linkedDomain: string;
  tradingPairs: TradingPair[];
  createdAt: string;
}

export function PermissionedDEXsCreator() {
  const { dexs, setDexs } = useDEXs();
  const [isCreating, setIsCreating] = useState(false);
  const [newDEX, setNewDEX] = useState({
    linkedDomain: "",
    tradingPairs: [] as TradingPair[],
  });
  const [currentPair, setCurrentPair] = useState({ base: "", quote: "" });

  const { domains } = useDomains();

  // include both alias + ID for dropdown display
  const availableDomains = domains.map((domain) => ({
    value: domain.domainId,
    label: domain.alias
      ? `${domain.alias} (${domain.domainId})`
      : domain.domainId,
  }));


  const availableAssets = [
    "EURC",
    "EURX",
    "USDC",
    "RLUSD",
    "XRP",
    "BTC",
    "ETH",
  ];

  const addTradingPair = () => {
    if (!currentPair.base || !currentPair.quote) {
      toast.error("Please select both base and quote assets");
      return;
    }
    if (currentPair.base === currentPair.quote) {
      toast.error("Base and quote assets must be different");
      return;
    }
    setNewDEX({
      ...newDEX,
      tradingPairs: [...newDEX.tradingPairs, currentPair],
    });
    setCurrentPair({ base: "", quote: "" });
  };

  const removeTradingPair = (index: number) => {
    setNewDEX({
      ...newDEX,
      tradingPairs: newDEX.tradingPairs.filter((_, i) => i !== index),
    });
  };

  const createDEX = () => {
    if (!newDEX.linkedDomain) {
      toast.error("Please select a linked domain");
      return;
    }

    // Auto-add current pair if both assets are selected
    let finalTradingPairs = [...newDEX.tradingPairs];
    if (currentPair.base && currentPair.quote) {
      if (currentPair.base === currentPair.quote) {
        toast.error("Base and quote assets must be different");
        return;
      }
      finalTradingPairs.push(currentPair);
    }

    if (finalTradingPairs.length === 0) {
      toast.error("Please add at least one trading pair");
      return;
    }

    const dex: DEX = {
      id: Date.now().toString(),
      dexId: `DEX-${Math.random().toString(16).substr(2, 8).toUpperCase()}`,
      linkedDomain: newDEX.linkedDomain,
      tradingPairs: finalTradingPairs,
      createdAt: new Date().toISOString(),
    };

    setDexs([...dexs, dex]);
    setNewDEX({
      linkedDomain: "",
      tradingPairs: [],
    });
    setCurrentPair({ base: "", quote: "" });
    setIsCreating(false);
    toast.success("Permissioned DEX created successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-slate-100 mb-2">Permissioned DEXs</h2>
          <p className="text-slate-400">
            Create and manage decentralized exchanges linked to domains
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create DEX
        </Button>
      </div>

      {/* DEXs Grid */}
      <div className="grid gap-4">
        {dexs.map((dex) => (
          <Card key={dex.id} className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg text-slate-100">{dex.dexId}</h3>
                  <Badge
                    variant="outline"
                    className="border-teal-500/30 text-teal-400"
                  >
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">
                  Linked Domain: {dex.linkedDomain}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Created {new Date(dex.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Trading Pairs */}
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-3">Trading Pairs</p>
              <div className="flex flex-wrap gap-2">
                {dex.tradingPairs.map((pair, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300"
                  >
                    {pair.base} / {pair.quote}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create DEX Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Create Permissioned DEX
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Domain Selection */}
            <div className="space-y-2">
              <Label>Linked Domain</Label>
              <Select
                value={newDEX.linkedDomain}
                onValueChange={(value) =>
                  setNewDEX({ ...newDEX, linkedDomain: value })
                }
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Select a domain to link" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {availableDomains.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                The DEX will inherit access rules from the selected domain
              </p>
            </div>

            {/* Trading Pairs */}
            <div className="space-y-3">
              <Label>Trading Pairs</Label>

              <div className="flex gap-2">
                <Select
                  value={currentPair.base}
                  onValueChange={(value) =>
                    setCurrentPair({ ...currentPair, base: value })
                  }
                >
                  <SelectTrigger className="flex-1 bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Base asset" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {availableAssets.map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-slate-500 flex items-center">/</span>

                <Select
                  value={currentPair.quote}
                  onValueChange={(value) =>
                    setCurrentPair({ ...currentPair, quote: value })
                  }
                >
                  <SelectTrigger className="flex-1 bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Quote asset" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {availableAssets.map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={addTradingPair}
                  size="icon"
                  variant="outline"
                  className="border-teal-500/30 text-teal-400"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {newDEX.tradingPairs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {newDEX.tradingPairs.map((pair, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg text-sm text-teal-400"
                    >
                      <span>
                        {pair.base} / {pair.quote}
                      </span>
                      <button
                        onClick={() => removeTradingPair(index)}
                        className="hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {newDEX.linkedDomain && (
              <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-teal-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-teal-300 mb-1">DEX Preview</p>
                    <p className="text-xs text-teal-400/80">
                      DEX ID will be auto-generated and linked to{" "}
                      {newDEX.linkedDomain}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsCreating(false)}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={createDEX}
                className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Create DEX
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
