import { useState } from 'react';
import { Globe, Plus, TrendingUp, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { usePolicies } from "../context/PolicyContext";
import { useDomains } from "../context/DomainContext";


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

export function DomainCreator() {
  const { domains, setDomains } = useDomains();

  const [isCreating, setIsCreating] = useState(false);
  const [newDomain, setNewDomain] = useState({
    policyName: "",
    tradingPairs: [] as TradingPair[],
    hybridOffers: false,
  });
  const [currentPair, setCurrentPair] = useState({ base: "", quote: "" });

  //const availablePolicies = ["MiCA Compliance Policy", "Custom Policy"];
  const { policies } = usePolicies();
  const availablePolicies = [
    "MiCA Compliance Policy",
    ...policies
      .filter((p) => p.name !== "MiCA Compliance Policy")
      .map((p) => p.name),
  ];

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
    setNewDomain({
      ...newDomain,
      tradingPairs: [...newDomain.tradingPairs, currentPair],
    });
    setCurrentPair({ base: "", quote: "" });
  };

  const removeTradingPair = (index: number) => {
    setNewDomain({
      ...newDomain,
      tradingPairs: newDomain.tradingPairs.filter((_, i) => i !== index),
    });
  };

  const createDomain = () => {
    if (!newDomain.policyName) {
      toast.error("Please select a policy");
      return;
    }

    const domain: Domain = {
      id: Date.now().toString(),
      domainId: `DOM-${Math.random().toString(16).substr(2, 8).toUpperCase()}`,
      policyName: newDomain.policyName,
      tradingPairs: [], // kept empty for compatibility
      hybridOffers: false,
      createdAt: new Date().toISOString(),
      stats: {
        users: 0,
        volume24h: "€0",
        trades: 0,
      },
    };

    setDomains([...domains, domain]);
    setNewDomain({ policyName: "", tradingPairs: [], hybridOffers: false });
    setIsCreating(false);
    toast.success("Permissioned domain created successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-slate-100 mb-2">Permissioned Domains</h2>
          <p className="text-slate-400">
            Create and manage trading environments with policy enforcement
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Domain
        </Button>
      </div>

      {/* Domains Grid */}
      <div className="grid gap-4">
        {domains.map((domain) => (
          <Card
            key={domain.id}
            className="bg-slate-900/50 border-slate-800 p-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg text-slate-100">{domain.domainId}</h3>
                  <Badge
                    variant="outline"
                    className="border-teal-500/30 text-teal-400"
                  >
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">
                  Policy: {domain.policyName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Created {new Date(domain.createdAt).toLocaleDateString()}
                </p>
              </div>
              {domain.hybridOffers && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Hybrid Offers
                </Badge>
              )}
            </div>

            {/* Trading Pairs */}
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-3">Trading Pairs</p>
              <div className="flex flex-wrap gap-2">
                {domain.tradingPairs.map((pair, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300"
                  >
                    {pair.base} / {pair.quote}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div>
                <p className="text-xs text-slate-500 mb-1">Verified Users</p>
                <p className="text-xl text-slate-100">{domain.stats.users}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">24h Volume</p>
                <p className="text-xl text-slate-100">
                  {domain.stats.volume24h}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Trades</p>
                <p className="text-xl text-slate-100">{domain.stats.trades}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Domain Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Create Permissioned Domain
            </DialogTitle>
          </DialogHeader>

          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Create Permissioned Domain
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Policy Selection */}
              <div className="space-y-2">
                <Label>Linked Policy</Label>
                <Select
                  value={newDomain.policyName}
                  onValueChange={(value) =>
                    setNewDomain({ ...newDomain, policyName: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Select a policy to link" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wide">
                      Default
                    </div>
                    <SelectItem value="MiCA Compliance Policy">
                      MiCA Compliance Policy
                    </SelectItem>

                    {policies.length > 1 && (
                      <>
                        <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wide border-t border-slate-700 mt-2">
                          Custom
                        </div>
                        {policies
                          .filter((p) => p.name !== "MiCA Compliance Policy")
                          .map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>

                <p className="text-xs text-slate-500">
                  Only users meeting this policy's criteria can access the
                  domain.
                </p>
              </div>

              {/* Preview */}
              {newDomain.policyName && (
                <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-teal-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-teal-300 mb-1">
                        Domain Preview
                      </p>
                      <p className="text-xs text-teal-400/80">
                        DomainID will be auto-generated and linked to{" "}
                        {newDomain.policyName}
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
                  onClick={createDomain}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Create Domain
                </Button>
              </div>
            </div>
          </DialogContent>
        </DialogContent>
      </Dialog>
    </div>
  );
}
