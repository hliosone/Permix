import { useState } from 'react';
import { ShieldCheck, UserPlus, Key, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface Delegation {
  id: string;
  delegateAddress: string;
  permissions: {
    freeze: boolean;
    clawback: boolean;
    revokeCredential: boolean;
  };
  createdAt: string;
  status: 'active' | 'pending';
}

export function PermissionDelegation() {
  const [delegations, setDelegations] = useState<Delegation[]>([
    {
      id: '1',
      delegateAddress: 'rKLpjpCoXgLQQYQyj3W8FGfKmY8gBqvGK5',
      permissions: {
        freeze: true,
        clawback: false,
        revokeCredential: true,
      },
      createdAt: new Date().toISOString(),
      status: 'active',
    },
  ]);
  const [delegateAddress, setDelegateAddress] = useState('');
  const [permissions, setPermissions] = useState({
    freeze: false,
    clawback: false,
    revokeCredential: false,
  });

  const handleDelegate = () => {
    if (!delegateAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    if (!permissions.freeze && !permissions.clawback && !permissions.revokeCredential) {
      toast.error('Please select at least one permission');
      return;
    }

    const newDelegation: Delegation = {
      id: Date.now().toString(),
      delegateAddress: delegateAddress.trim(),
      permissions: { ...permissions },
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setDelegations([...delegations, newDelegation]);
    setDelegateAddress('');
    setPermissions({
      freeze: false,
      clawback: false,
      revokeCredential: false,
    });
    toast.success('Delegation transaction submitted!');

    // Simulate confirmation
    setTimeout(() => {
      setDelegations((current) =>
        current.map((d) =>
          d.id === newDelegation.id ? { ...d, status: 'active' as const } : d
        )
      );
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl text-slate-100 mb-2">Permission Delegation</h2>
        <p className="text-slate-400">
          Delegate admin actions to other wallets using XRPL Permission Delegation
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-teal-500/10 to-teal-600/10 border-teal-500/30 p-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h3 className="text-slate-100 mb-2">XRPL Native Delegation</h3>
            <p className="text-sm text-slate-300 mb-3">
              Use the Permission Delegation amendment to grant specific admin rights without requiring
              multisig or secondary wallets. All delegated actions are recorded on-chain.
            </p>
            <div className="flex gap-4 text-xs text-teal-300">
              <span>✓ No multisig required</span>
              <span>✓ Granular permissions</span>
              <span>✓ On-chain verification</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create Delegation */}
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <h3 className="text-lg text-slate-100 mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-400" />
            Create New Delegation
          </h3>

          <div className="space-y-6">
            {/* Wallet Address */}
            <div className="space-y-2">
              <Label>Delegate Wallet Address</Label>
              <Input
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={delegateAddress}
                onChange={(e) => setDelegateAddress(e.target.value)}
                className="bg-slate-800/50 border-slate-700 font-mono"
              />
              <p className="text-xs text-slate-500">
                Enter the XRPL address that will receive delegated permissions
              </p>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label>Grant Permissions</Label>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    checked={permissions.freeze}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, freeze: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-slate-200 mb-1">Freeze Wallet</p>
                    <p className="text-xs text-slate-500">
                      Ability to freeze user wallets and prevent trading
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    checked={permissions.clawback}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, clawback: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-slate-200 mb-1">Clawback Tokens</p>
                    <p className="text-xs text-slate-500">
                      Ability to recover tokens from user accounts
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    checked={permissions.revokeCredential}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, revokeCredential: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-slate-200 mb-1">Revoke Credentials</p>
                    <p className="text-xs text-slate-500">
                      Ability to revoke user verifiable credentials
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleDelegate}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Delegate Permissions
            </Button>
          </div>
        </Card>

        {/* Active Delegations */}
        <div className="space-y-4">
          <h3 className="text-lg text-slate-100 flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            Active Delegations
          </h3>

          <div className="space-y-3">
            {delegations.map((delegation) => (
              <Card key={delegation.id} className="bg-slate-900/50 border-slate-800 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-slate-300 font-mono text-sm mb-1 truncate">
                      {delegation.delegateAddress}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(delegation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    className={
                      delegation.status === 'active'
                        ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }
                  >
                    {delegation.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {delegation.permissions.freeze && (
                    <span className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400">
                      Freeze
                    </span>
                  )}
                  {delegation.permissions.clawback && (
                    <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-400">
                      Clawback
                    </span>
                  )}
                  {delegation.permissions.revokeCredential && (
                    <span className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                      Revoke
                    </span>
                  )}
                </div>
              </Card>
            ))}

            {delegations.length === 0 && (
              <Card className="bg-slate-900/30 border-slate-800 border-dashed p-8 text-center">
                <Key className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No delegations yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Create your first delegation to get started
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <Card className="bg-slate-900/30 border-slate-800 p-6">
        <h4 className="text-slate-100 mb-3">How It Works</h4>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center mb-3">
              <span className="text-teal-400">1</span>
            </div>
            <p className="text-slate-300 mb-1">Grant Permissions</p>
            <p className="text-slate-500 text-xs">
              Select specific admin actions to delegate to another wallet
            </p>
          </div>
          <div>
            <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center mb-3">
              <span className="text-teal-400">2</span>
            </div>
            <p className="text-slate-300 mb-1">On-Chain Record</p>
            <p className="text-slate-500 text-xs">
              Delegation is recorded directly on XRP Ledger via Permission Delegation amendment
            </p>
          </div>
          <div>
            <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center mb-3">
              <span className="text-teal-400">3</span>
            </div>
            <p className="text-slate-300 mb-1">Secure Execution</p>
            <p className="text-slate-500 text-xs">
              Delegated wallet can execute permitted actions without your direct approval
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
