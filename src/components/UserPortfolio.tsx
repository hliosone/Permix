import { TrendingUp, Shield, Award, ArrowLeft, Coins, Activity } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface UserPortfolioProps {
  domain: {
    id: string;
    name: string;
    policy: string;
  };
  onBackToTrading: () => void;
}

export function UserPortfolio({ domain, onBackToTrading }: UserPortfolioProps) {
  const balances = [
    { asset: 'EURC', balance: '5,234.56', value: '€5,234.56', change: '+2.3%' },
    { asset: 'RLUSD', balance: '12,456.78', value: '€12,751.24', change: '+1.2%' },
    { asset: 'EURX', balance: '3,456.89', value: '€3,456.89', change: '-0.5%' },
    { asset: 'XRP', balance: '25,432.10', value: '€12,258.37', change: '+5.7%' },
  ];

  const credentials = [
    {
      type: 'MemberOfDomain',
      issuer: domain.id,
      issued: '2024-11-07',
      status: 'Active',
      expires: '2025-11-07',
    },
    {
      type: 'KYC Level 2',
      issuer: 'EU Digital Identity',
      issued: '2024-06-15',
      status: 'Active',
      expires: '2026-06-15',
    },
  ];

  const recentActivity = [
    { type: 'Buy', pair: 'EURC/RLUSD', amount: '500.00 EURC', price: '1.0234', time: '2 hours ago' },
    { type: 'Sell', pair: 'XRP/RLUSD', amount: '1,000.00 XRP', price: '0.4821', time: '5 hours ago' },
    { type: 'Buy', pair: 'EURX/XRP', amount: '250.00 EURX', price: '2.1543', time: '1 day ago' },
    { type: 'Credential', pair: 'MemberOfDomain', amount: 'Received', price: '-', time: '2 days ago' },
  ];

  const totalValue = balances.reduce((sum, b) => {
    const value = parseFloat(b.value.replace(/[€,]/g, ''));
    return sum + value;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-slate-100 mb-1">Portfolio</h2>
          <p className="text-slate-400">{domain.name}</p>
        </div>
        <Button
          onClick={onBackToTrading}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trading
        </Button>
      </div>

      {/* Total Value */}
      <Card className="bg-gradient-to-br from-teal-500/20 to-transparent border-teal-500/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 mb-2">Total Portfolio Value</p>
            <p className="text-4xl text-slate-100 mb-2">€{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                <TrendingUp className="w-3 h-3 mr-1" />
                +3.2% (24h)
              </Badge>
            </div>
          </div>
          <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center">
            <Coins className="w-8 h-8 text-teal-400" />
          </div>
        </div>
      </Card>

      {/* Balances */}
      <Card className="bg-slate-900/50 border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg text-slate-100">Asset Balances</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Asset</TableHead>
              <TableHead className="text-slate-400 text-right">Balance</TableHead>
              <TableHead className="text-slate-400 text-right">Value (EUR)</TableHead>
              <TableHead className="text-slate-400 text-right">24h Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map((balance) => (
              <TableRow key={balance.asset} className="border-slate-800 hover:bg-slate-800/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex items-center justify-center">
                      <span className="text-xs text-amber-400">{balance.asset[0]}</span>
                    </div>
                    <span className="text-slate-100">{balance.asset}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-slate-100">{balance.balance}</TableCell>
                <TableCell className="text-right text-slate-100">{balance.value}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    className={
                      balance.change.startsWith('+')
                        ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }
                  >
                    {balance.change}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Credentials */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg text-slate-100">Verifiable Credentials</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {credentials.map((credential, index) => (
            <Card key={index} className="bg-slate-800/30 border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h4 className="text-slate-100">{credential.type}</h4>
                </div>
                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                  {credential.status}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-400">
                  Issuer: <span className="text-slate-300">{credential.issuer}</span>
                </p>
                <p className="text-slate-400">
                  Issued: <span className="text-slate-300">{credential.issued}</span>
                </p>
                <p className="text-slate-400">
                  Expires: <span className="text-slate-300">{credential.expires}</span>
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-slate-900/50 border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg text-slate-100">Recent Activity</h3>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Type</TableHead>
              <TableHead className="text-slate-400">Pair/Action</TableHead>
              <TableHead className="text-slate-400 text-right">Amount</TableHead>
              <TableHead className="text-slate-400 text-right">Price</TableHead>
              <TableHead className="text-slate-400 text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivity.map((activity, index) => (
              <TableRow key={index} className="border-slate-800 hover:bg-slate-800/30">
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      activity.type === 'Buy'
                        ? 'border-teal-500/30 text-teal-400'
                        : activity.type === 'Sell'
                        ? 'border-red-500/30 text-red-400'
                        : 'border-amber-500/30 text-amber-400'
                    }
                  >
                    {activity.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300">{activity.pair}</TableCell>
                <TableCell className="text-right text-slate-100">{activity.amount}</TableCell>
                <TableCell className="text-right text-slate-300">{activity.price}</TableCell>
                <TableCell className="text-right text-slate-400 text-sm">{activity.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Domain Participation Info */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h4 className="text-slate-100 mb-2">Active Domain Participation</h4>
            <p className="text-sm text-slate-300 mb-3">
              You're currently participating in <strong>{domain.name}</strong> with verified credentials.
              Your access is governed by the <strong>{domain.policy}</strong>.
            </p>
            <div className="flex gap-4 text-xs text-amber-300">
              <span>✓ Identity Verified</span>
              <span>✓ Trading Enabled</span>
              <span>✓ Full Access</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
