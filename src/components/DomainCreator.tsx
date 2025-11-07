import { useState, useEffect } from 'react';
import { Globe, Plus, TrendingUp, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  createXRPLClient,
  disconnectXRPLClient,
} from '../services/xrpl-setup';
import { createPermissionedDomain } from '../services/permissioned-domains';
import { signAndSubmitTransaction, getWalletForSigning } from '../services/transaction-signer';
import { addEnterpriseDomain, getEnterpriseData } from '../services/enterprise-storage';
import type { Client } from 'xrpl';

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

interface DomainCreatorProps {
  walletAddress: string;
}

export function DomainCreator({ walletAddress }: DomainCreatorProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDomain, setNewDomain] = useState({
    domainName: '',
    policyName: '',
    tradingPairs: [] as TradingPair[],
    hybridOffers: false,
    requiredCredentials: [] as string[],
  });
  const [currentPair, setCurrentPair] = useState({ base: '', quote: '' });

  // Load domains from enterprise storage
  useEffect(() => {
    const enterpriseData = getEnterpriseData(walletAddress);
    if (enterpriseData && enterpriseData.domains.length > 0) {
      const loadedDomains: Domain[] = enterpriseData.domains.map((domain) => ({
        id: domain.id,
        domainId: domain.domainId,
        policyName: domain.description || 'Custom Policy',
        tradingPairs: [], // Would need to fetch from DEX or store separately
        hybridOffers: false,
        createdAt: domain.createdAt,
        stats: {
          users: 0,
          volume24h: '€0',
          trades: 0,
        },
      }));
      setDomains(loadedDomains);
    }
  }, [walletAddress]);

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

  const createDomain = async () => {
    if (!newDomain.domainName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }
    if (!newDomain.policyName) {
      toast.error('Please select a policy');
      return;
    }

    setIsSubmitting(true);
    let client: Client | null = null;

    try {
      // 1. Connect to XRPL
      toast.loading('Connecting to XRPL...', { id: 'domain-connect' });
      client = await createXRPLClient();
      toast.success('Connected to XRPL', { id: 'domain-connect' });

      // 2. Get wallet for signing
      const wallet = getWalletForSigning('issuer');
      if (!wallet) {
        throw new Error('Wallet not available. Please check environment variables.');
      }

      // 3. Create permissioned domain
      toast.loading('Creating permissioned domain...', { id: 'create-domain' });
      const result = await createPermissionedDomain(
        client,
        wallet.address,
        {
          domainName: newDomain.domainName,
          requiredCredentials: newDomain.requiredCredentials.length > 0 
            ? newDomain.requiredCredentials 
            : undefined,
          description: newDomain.policyName,
        }
      );

      if (result.success && result.transaction) {
        // 4. Sign and submit transaction
        toast.loading('Signing and submitting transaction...', { id: 'sign-domain' });
        const submitResult = await signAndSubmitTransaction(client, result.transaction, wallet);

        if (!submitResult.success) {
          throw new Error(submitResult.error || 'Failed to submit transaction');
        }

        // 5. Save domain to enterprise storage
        // Note: domainId would come from the transaction result in production
        const domainId = `domain_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const savedDomain = addEnterpriseDomain(walletAddress, {
          domainId,
          domainName: newDomain.domainName,
          creator: wallet.address,
          requiredCredentials: newDomain.requiredCredentials,
          description: newDomain.policyName,
          transactionHash: submitResult.hash,
        });

        // 6. Add domain to local state
        const domain: Domain = {
          id: savedDomain.id,
          domainId,
          policyName: newDomain.policyName,
          tradingPairs: newDomain.tradingPairs,
          hybridOffers: newDomain.hybridOffers,
          createdAt: savedDomain.createdAt,
          stats: {
            users: 0,
            volume24h: '€0',
            trades: 0,
          },
        };

        setDomains([...domains, domain]);
        setNewDomain({
          domainName: '',
          policyName: '',
          tradingPairs: [],
          hybridOffers: false,
          requiredCredentials: [],
        });
        setIsCreating(false);

        toast.success(
          `Domain created successfully! Transaction: ${submitResult.hash?.substring(0, 8)}...`,
          { id: 'sign-domain', duration: 5000 }
        );
      } else {
        throw new Error(result.error || 'Failed to create domain');
      }
    } catch (error) {
      console.error('Error creating domain:', error);
      toast.error(
        `Failed to create domain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { id: 'create-domain' }
      );
    } finally {
      if (client) {
        try {
          await disconnectXRPLClient(client);
        } catch (error) {
          console.error('Error disconnecting from XRPL:', error);
        }
      }
      setIsSubmitting(false);
    }
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
            {/* Domain Name */}
            <div className="space-y-2">
              <Label>Domain Name</Label>
              <Input
                placeholder="e.g., MiCA Trading Domain"
                value={newDomain.domainName}
                onChange={(e) => setNewDomain({ ...newDomain, domainName: e.target.value })}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>

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
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create Domain
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
