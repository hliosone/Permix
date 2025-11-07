import { useState, useEffect } from 'react';
import { Users, TrendingUp, Activity, Coins, AlertTriangle, Clock, Globe } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { getEnterpriseData, type EnterpriseData } from '../services/enterprise-storage';

interface DashboardOverviewProps {
  companyName: string;
  walletAddress: string;
}

export function DashboardOverview({ companyName, walletAddress }: DashboardOverviewProps) {
  const [enterpriseData, setEnterpriseData] = useState<EnterpriseData | null>(null);

  useEffect(() => {
    const data = getEnterpriseData(walletAddress);
    setEnterpriseData(data);
  }, [walletAddress]);

  // Calculate stats from real data
  const totalTokens = enterpriseData?.tokens.length || 0;
  const totalDomains = enterpriseData?.domains.length || 0;
  const totalDEXes = enterpriseData?.dexes.length || 0;
  
  // Calculate recent activity count (last 24 hours)
  const recentActivityCount = enterpriseData
    ? [
        ...enterpriseData.tokens,
        ...enterpriseData.domains,
        ...enterpriseData.dexes,
      ].filter((item) => {
        const createdAt = new Date(item.createdAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursDiff <= 24;
      }).length
    : 0;

  const stats = [
    {
      label: 'Total Tokens',
      value: totalTokens.toString(),
      change: recentActivityCount > 0 ? `+${recentActivityCount}` : '0',
      icon: Coins,
      color: 'purple',
    },
    {
      label: 'Active Domains',
      value: totalDomains.toString(),
      change: totalDomains > 0 ? 'Active' : 'None',
      icon: Globe,
      color: 'blue',
    },
    {
      label: 'Permissioned DEXes',
      value: totalDEXes.toString(),
      change: totalDEXes > 0 ? 'Active' : 'None',
      icon: Activity,
      color: 'teal',
    },
    {
      label: 'Total Assets',
      value: totalTokens.toString(),
      change: totalTokens > 0 ? 'Issued' : 'None',
      icon: TrendingUp,
      color: 'amber',
    },
  ];

  // Build recent actions from enterprise data
  const recentActions = enterpriseData
    ? [
        ...enterpriseData.tokens.map((token) => ({
          id: token.id,
          type: 'Token Created',
          name: token.name,
          code: token.code,
          timestamp: formatTimeAgo(token.createdAt),
          hash: token.transactionHashes?.[0]?.substring(0, 16) || 'N/A',
        })),
        ...enterpriseData.domains.map((domain) => ({
          id: domain.id,
          type: 'Domain Created',
          name: domain.domainName,
          code: domain.domainId.substring(0, 8),
          timestamp: formatTimeAgo(domain.createdAt),
          hash: domain.transactionHash?.substring(0, 16) || 'N/A',
        })),
        ...enterpriseData.dexes.map((dex) => ({
          id: dex.id,
          type: 'DEX Created',
          name: dex.dexName,
          code: dex.dexId.substring(0, 8),
          timestamp: formatTimeAgo(dex.createdAt),
          hash: dex.transactionHash?.substring(0, 16) || 'N/A',
        })),
      ]
        .sort((a, b) => {
          const timeA = new Date(
            enterpriseData.tokens.find((t) => t.id === a.id)?.createdAt ||
            enterpriseData.domains.find((d) => d.id === a.id)?.createdAt ||
            enterpriseData.dexes.find((d) => d.id === a.id)?.createdAt ||
            ''
          ).getTime();
          const timeB = new Date(
            enterpriseData.tokens.find((t) => t.id === b.id)?.createdAt ||
            enterpriseData.domains.find((d) => d.id === b.id)?.createdAt ||
            enterpriseData.dexes.find((d) => d.id === b.id)?.createdAt ||
            ''
          ).getTime();
          return timeB - timeA;
        })
        .slice(0, 10)
    : [];

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  const alerts = [
    {
      id: '1',
      type: 'warning',
      message: 'Unusual trading activity detected in DOM-7F3E9A2B',
      time: '5 min ago',
    },
    {
      id: '2',
      type: 'info',
      message: 'New credential verification request pending',
      time: '12 min ago',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl text-slate-100 mb-2">Dashboard</h2>
        <p className="text-slate-400">Welcome back, {companyName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-slate-900/50 border-slate-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-${stat.color}-500/10 rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                  {stat.change}
                </Badge>
              </div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl text-slate-100">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border p-4 ${
                alert.type === 'warning'
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-blue-500/5 border-blue-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 ${
                    alert.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-slate-200 mb-1">{alert.message}</p>
                  <p className="text-xs text-slate-500">{alert.time}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200">
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Actions */}
      <Card className="bg-slate-900/50 border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg text-slate-100 mb-1">Recent Actions</h3>
              <p className="text-sm text-slate-400">Signed transactions and policy enforcement</p>
            </div>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              View All
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Action Type</TableHead>
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">Code/ID</TableHead>
              <TableHead className="text-slate-400">Time</TableHead>
              <TableHead className="text-slate-400">Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActions.length > 0 ? (
              recentActions.map((action) => (
                <TableRow key={action.id} className="border-slate-800 hover:bg-slate-800/30">
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        action.type === 'Token Created'
                          ? 'border-purple-500/30 text-purple-400'
                          : action.type === 'Domain Created'
                          ? 'border-blue-500/30 text-blue-400'
                          : action.type === 'DEX Created'
                          ? 'border-teal-500/30 text-teal-400'
                          : 'border-slate-500/30 text-slate-400'
                      }
                    >
                      {action.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{action.name}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-400">{action.code}</TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {action.timestamp}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{action.hash}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="border-slate-800">
                <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                  No recent activity
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/30 p-6 cursor-pointer hover:border-teal-500/50 transition-colors">
          <h4 className="text-slate-100 mb-2">Create Policy</h4>
          <p className="text-sm text-slate-400">Build new access rules for compliance</p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30 p-6 cursor-pointer hover:border-amber-500/50 transition-colors">
          <h4 className="text-slate-100 mb-2">Launch Domain</h4>
          <p className="text-sm text-slate-400">Deploy a new permissioned trading zone</p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30 p-6 cursor-pointer hover:border-blue-500/50 transition-colors">
          <h4 className="text-slate-100 mb-2">Issue Asset</h4>
          <p className="text-sm text-slate-400">Create compliant tokens with smart flags</p>
        </Card>
      </div>
    </div>
  );
}
