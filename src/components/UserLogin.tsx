import { useState } from 'react';
import { Wallet, User, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface UserLoginProps {
  onAuth: (data: { walletAddress: string }) => void;
  onBack: () => void;
}

export function UserLogin({ onAuth, onBack }: UserLoginProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleWalletConnect = () => {
    setIsConnecting(true);
    // Simulate wallet connection
    setTimeout(() => {
      const mockAddress = 'rUmbertoQzXKB8gTZbVqEqcY9oP3Jfx2Lp';
      onAuth({ walletAddress: mockAddress });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent pointer-events-none" />
      
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
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl text-slate-100 mb-2">User Access</h2>
            <p className="text-slate-400">Connect your wallet to access permissioned domains</p>
          </div>

          {/* Wallet Connection */}
          <div className="space-y-3 mb-6">
            <Button
              onClick={handleWalletConnect}
              disabled={isConnecting}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
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

          {/* Info */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-300/80">
              After connecting, you'll be able to join permissioned domains and verify your identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}