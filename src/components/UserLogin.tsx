import { useState, useEffect } from "react";
import { Wallet, User, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import useWalletManager from "../context/useWalletManager";
import { XamanAdapter, CrossmarkAdapter } from "xrpl-connect";

interface UserLoginProps {
  onAuth: (data: { walletAddress: string }) => void;
  onBack: () => void;
}

export function UserLogin({ onAuth, onBack }: UserLoginProps) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // ✅ Initialize wallet manager (use same adapters as enterprise)
  const { walletManager, account, connected, connectorRef, disconnect } =
    useWalletManager([new XamanAdapter(), new CrossmarkAdapter()]);

  // ✅ When wallet connects, trigger login
  useEffect(() => {
    if (connected && account && !walletConnected) {
      setWalletConnected(true);
      setWalletAddress(account.address);
      onAuth({ walletAddress: account.address });
    }
  }, [connected, account, walletConnected, onAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
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
            <p className="text-slate-400">
              Connect your wallet to access permissioned domains
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="space-y-3 mb-6">
            <Label className="text-slate-300">XRPL Wallet</Label>

            <div className="flex flex-col gap-3 items-center">
              {/* ✅ Real wallet connect component */}
              <xrpl-wallet-connector
                ref={connectorRef}
                id="wallet-connector"
                primary-wallet="xaman"
              ></xrpl-wallet-connector>

              {walletConnected && (
                <Button
                  onClick={async () => {
                    try {
                      await disconnect();
                    } catch (e) {
                      console.warn("Disconnect error:", e);
                    } finally {
                      setWalletConnected(false);
                      setWalletAddress("");
                    }
                  }}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          {/* Wallet Info */}
          {walletConnected && (
            <div className="text-center mt-4">
              <p className="text-slate-400 text-sm">Connected as:</p>
              <p className="text-slate-200 font-mono text-xs mt-1">
                {walletAddress}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-6">
            <p className="text-sm text-amber-300/80">
              After connecting, you'll be able to join permissioned domains and
              verify your identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
