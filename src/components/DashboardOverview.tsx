import { Users, TrendingUp, Activity, Coins, AlertTriangle, Clock } from 'lucide-react';
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

interface DashboardOverviewProps {
  companyName: string;
}

export function DashboardOverview({ companyName }: DashboardOverviewProps) {
  const stats = [
    {
      label: 'Verified Users',
      value: '1,247',
      change: '+12.3%',
      icon: Users,
      color: 'teal',
    },
    {
      label: '24h Volume',
      value: '€2.4M',
      change: '+8.7%',
      icon: TrendingUp,
      color: 'amber',
    },
    {
      label: 'Active Domains',
      value: '3',
      change: '+1',
      icon: Activity,
      color: 'blue',
    },
    {
      label: 'Total Assets',
      value: '5',
      change: '+2',
      icon: Coins,
      color: 'purple',
    },
  ];

  const recentActions = [
    {
      id: '1',
      type: 'Credential Issued',
      user: 'rKLpjpCoXgLQQYQyj3W8FGfKmY8gBqvGK5',
      policy: 'MiCA Compliance',
      timestamp: '2 minutes ago',
      hash: '8F7E6D5C4B3A2B1A',
    },
    {
      id: '2',
      type: 'Wallet Frozen',
      user: 'rN4h7WJmn5qDtG8PqCvXbUkL3pF9sT2Hx7',
      policy: 'FINMA Policy',
      timestamp: '15 minutes ago',
      hash: '1A2B3C4D5E6F7G8H',
    },
    {
      id: '3',
      type: 'Token Clawback',
      user: 'rPQr8sT9uV0wX1yZ2aB3cD4eF5gH6iJ7kL',
      policy: 'MiCA Compliance',
      timestamp: '1 hour ago',
      hash: '9I8H7G6F5E4D3C2B',
    },
    {
      id: '4',
      type: 'Credential Revoked',
      user: 'rMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr',
      policy: 'Custom Policy',
      timestamp: '3 hours ago',
      hash: 'A1B2C3D4E5F6G7H8',
    },
  ];

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
              <TableHead className="text-slate-400">User</TableHead>
              <TableHead className="text-slate-400">Policy</TableHead>
              <TableHead className="text-slate-400">Time</TableHead>
              <TableHead className="text-slate-400">Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActions.map((action) => (
              <TableRow key={action.id} className="border-slate-800 hover:bg-slate-800/30">
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      action.type === 'Credential Issued'
                        ? 'border-teal-500/30 text-teal-400'
                        : action.type === 'Wallet Frozen'
                        ? 'border-cyan-500/30 text-cyan-400'
                        : action.type === 'Token Clawback'
                        ? 'border-purple-500/30 text-purple-400'
                        : 'border-red-500/30 text-red-400'
                    }
                  >
                    {action.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-slate-300 max-w-[200px] truncate">
                  {action.user}
                </TableCell>
                <TableCell className="text-slate-300">{action.policy}</TableCell>
                <TableCell className="text-slate-400 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {action.timestamp}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500">{action.hash}</TableCell>
              </TableRow>
            ))}
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
