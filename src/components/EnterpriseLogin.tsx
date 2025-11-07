import { useState } from 'react';
import { Wallet, Building2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EnterpriseLoginProps {
  onAuth: (data: { walletAddress: string; companyName: string }) => void;
  onBack: () => void;
}

export function EnterpriseLogin({ onAuth, onBack }: EnterpriseLoginProps) {
  const [companyName, setCompanyName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleWalletConnect = () => {
    setIsConnecting(true);
    // Simulate wallet connection
    setTimeout(() => {
      const mockAddress = 'rN7n7otQDd6FczFgLdOqDdqu7h3oMVUi9M';
      setWalletAddress(mockAddress);
      setWalletConnected(true);
      setIsConnecting(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletConnected && companyName.trim()) {
      onAuth({ walletAddress, companyName: companyName.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="text-2xl text-slate-100 mb-2">Enterprise Access</h2>
            <p className="text-slate-400">Connect your wallet to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Wallet Connection */}
            <div className="space-y-3">
              <Label className="text-slate-300">XRPL Wallet</Label>
              {!walletConnected ? (
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={handleWalletConnect}
                    disabled={isConnecting}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect with Xumm
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleWalletConnect}
                    disabled={isConnecting}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect with GemWallet
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-teal-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                  <span className="text-slate-300 text-sm font-mono flex-1 truncate">
                    {walletAddress}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setWalletConnected(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Company Name */}
            {walletConnected && (
              <div className="space-y-3">
                <Label htmlFor="companyName" className="text-slate-300">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  required
                />
              </div>
            )}

            {/* Submit */}
            {walletConnected && (
              <Button
                type="submit"
                disabled={!companyName.trim()}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
              >
                Continue to Dashboard
              </Button>
            )}
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
            <p className="text-sm text-teal-300/80">
              Your wallet will be used to sign transactions and issue verifiable credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
