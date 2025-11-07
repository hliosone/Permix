import { Globe, Users, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface DomainSelectorProps {
  onSelect: (domain: { id: string; name: string; policy: string }) => void;
}

export function DomainSelector({ onSelect }: DomainSelectorProps) {
  const domains = [
    {
      id: 'DOM-7F3E9A2B',
      name: 'EU Regulated Trading',
      company: 'FinanceHub SA',
      policy: 'MiCA Compliance Policy',
      description: 'MiCA-compliant trading zone for EU residents',
      tradingPairs: ['EURC/RLUSD', 'EURX/XRP'],
      stats: {
        users: 127,
        volume24h: '€234,567',
        avgTrade: '€1,847',
      },
      requirements: ['Age ≥ 18', 'EU Residency', 'KYC Level 2'],
    },
    {
      id: 'DOM-A4B8C2D6',
      name: 'Swiss Finance Zone',
      company: 'SwissBank AG',
      policy: 'FINMA Policy',
      description: 'FINMA-compliant domain for institutional trading',
      tradingPairs: ['USDC/RLUSD', 'BTC/XRP'],
      stats: {
        users: 89,
        volume24h: '$567,890',
        avgTrade: '$6,381',
      },
      requirements: ['Accredited Investor', 'Switzerland Residency'],
    },
    {
      id: 'DOM-E9F1G3H5',
      name: 'Global Stablecoin Market',
      company: 'CryptoTrade Inc',
      policy: 'Custom Policy',
      description: 'Open access stablecoin trading with basic verification',
      tradingPairs: ['USDC/RLUSD', 'EURC/USDC', 'DAI/RLUSD'],
      stats: {
        users: 543,
        volume24h: '$1,234,567',
        avgTrade: '$2,271',
      },
      requirements: ['Age ≥ 18', 'Email Verified'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl text-slate-100 mb-3">Select a Domain</h2>
        <p className="text-slate-400">
          Choose a permissioned trading environment to join. Each domain has specific requirements
          you'll need to verify.
        </p>
      </div>

      {/* Domains Grid */}
      <div className="grid gap-6 max-w-5xl mx-auto">
        {domains.map((domain) => (
          <Card
            key={domain.id}
            className="bg-slate-900/50 border-slate-800 p-6 hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl text-slate-100">{domain.name}</h3>
                      <Badge variant="outline" className="border-teal-500/30 text-teal-400">
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">{domain.company}</p>
                    <code className="text-xs text-slate-500">{domain.id}</code>
                  </div>
                </div>

                <p className="text-slate-300 mb-4">{domain.description}</p>

                {/* Requirements */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-slate-400">Requirements:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {domain.requirements.map((req, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-300"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trading Pairs */}
                <div className="flex flex-wrap gap-2">
                  {domain.tradingPairs.map((pair, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-teal-500/10 border border-teal-500/30 rounded text-xs text-teal-400"
                    >
                      {pair}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats & Action */}
              <div className="lg:w-64 flex flex-col">
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-4 mb-4">
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-500">Users</p>
                    </div>
                    <p className="text-lg text-slate-100">{domain.stats.users}</p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-500">24h Volume</p>
                    </div>
                    <p className="text-lg text-slate-100">{domain.stats.volume24h}</p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Avg Trade</p>
                    <p className="text-lg text-slate-100">{domain.stats.avgTrade}</p>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    onSelect({
                      id: domain.id,
                      name: domain.name,
                      policy: domain.policy,
                    })
                  }
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white mt-auto"
                >
                  Join Domain
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Footer */}
      <div className="max-w-5xl mx-auto">
        <Card className="bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30 p-4">
          <p className="text-sm text-slate-300">
            💡 <strong>Tip:</strong> After selecting a domain, you'll verify your identity using
            your EUDI wallet via OID4VP. Only attributes required by the domain's policy will be
            requested.
          </p>
        </Card>
      </div>
    </div>
  );
}
