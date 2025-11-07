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
import { toast } from 'sonner';

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
  const [domains, setDomains] = useState<Domain[]>([
    {
      id: '1',
      domainId: 'DOM-7F3E9A2B',
      policyName: 'MiCA Compliance Policy',
      tradingPairs: [
        { base: 'EURC', quote: 'RLUSD' },
        { base: 'EURX', quote: 'XRP' },
      ],
      hybridOffers: true,
      createdAt: new Date().toISOString(),
      stats: {
        users: 127,
        volume24h: '€234,567',
        trades: 1843,
      },
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newDomain, setNewDomain] = useState({
    policyName: '',
    tradingPairs: [] as TradingPair[],
    hybridOffers: false,
  });
  const [currentPair, setCurrentPair] = useState({ base: '', quote: '' });

  const availablePolicies = ['MiCA Compliance Policy', 'FINMA Policy', 'Custom Policy'];
  const availableAssets = ['EURC', 'EURX', 'USDC', 'RLUSD', 'XRP', 'BTC', 'ETH'];

  const addTradingPair = () => {
    if (!currentPair.base || !currentPair.quote) {
      toast.error('Please select both base and quote assets');
      return;
    }
    if (currentPair.base === currentPair.quote) {
      toast.error('Base and quote assets must be different');
      return;
    }
    setNewDomain({
      ...newDomain,
      tradingPairs: [...newDomain.tradingPairs, currentPair],
    });
    setCurrentPair({ base: '', quote: '' });
  };

  const removeTradingPair = (index: number) => {
    setNewDomain({
      ...newDomain,
      tradingPairs: newDomain.tradingPairs.filter((_, i) => i !== index),
    });
  };

  const createDomain = () => {
    if (!newDomain.policyName) {
      toast.error('Please select a policy');
      return;
    }
    if (newDomain.tradingPairs.length === 0) {
      toast.error('Please add at least one trading pair');
      return;
    }

    const domain: Domain = {
      id: Date.now().toString(),
      domainId: `DOM-${Math.random().toString(16).substr(2, 8).toUpperCase()}`,
      ...newDomain,
      createdAt: new Date().toISOString(),
      stats: {
        users: 0,
        volume24h: '€0',
        trades: 0,
      },
    };

    setDomains([...domains, domain]);
    setNewDomain({
      policyName: '',
      tradingPairs: [],
      hybridOffers: false,
    });
    setIsCreating(false);
    toast.success('Permissioned domain created successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-slate-100 mb-2">Permissioned Domains</h2>
          <p className="text-slate-400">Create and manage trading environments with policy enforcement</p>
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
          <Card key={domain.id} className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg text-slate-100">{domain.domainId}</h3>
                  <Badge variant="outline" className="border-teal-500/30 text-teal-400">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">Policy: {domain.policyName}</p>
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
                <p className="text-xl text-slate-100">{domain.stats.volume24h}</p>
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
            <DialogTitle className="text-2xl">Create Permissioned Domain</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Policy Selection */}
            <div className="space-y-2">
              <Label>Linked Policy</Label>
              <Select value={newDomain.policyName} onValueChange={(value) => setNewDomain({ ...newDomain, policyName: value })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Select a policy to link" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {availablePolicies.map((policy) => (
                    <SelectItem key={policy} value={policy}>
                      {policy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Only users meeting this policy's criteria can access the domain
              </p>
            </div>

            {/* Trading Pairs */}
            <div className="space-y-3">
              <Label>Trading Pairs</Label>
              
              <div className="flex gap-2">
                <Select value={currentPair.base} onValueChange={(value) => setCurrentPair({ ...currentPair, base: value })}>
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

                <Select value={currentPair.quote} onValueChange={(value) => setCurrentPair({ ...currentPair, quote: value })}>
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

              {newDomain.tradingPairs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {newDomain.tradingPairs.map((pair, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg text-sm text-teal-400"
                    >
                      <span>{pair.base} / {pair.quote}</span>
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

            {/* Hybrid Offers */}
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <div>
                <p className="text-slate-300 mb-1">Enable Hybrid Offers</p>
                <p className="text-xs text-slate-500">
                  Allow partial order matching between permissioned and non-permissioned users
                </p>
              </div>
              <Switch
                checked={newDomain.hybridOffers}
                onCheckedChange={(checked) => setNewDomain({ ...newDomain, hybridOffers: checked })}
              />
            </div>

            {/* Preview */}
            {newDomain.policyName && (
              <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-teal-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-teal-300 mb-1">Domain Preview</p>
                    <p className="text-xs text-teal-400/80">
                      DomainID will be auto-generated and linked to {newDomain.policyName}
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
      </Dialog>
    </div>
  );
}
