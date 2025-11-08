import { useState } from "react";
import { Building2, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import useWalletManager from "../context/useWalletManager";
import { CrossmarkAdapter, XamanAdapter } from "xrpl-connect";
import PaymentForm from "./PaymentForm";

export function EnterpriseLogin({ onAuth, onBack }) {
  const [companyName, setCompanyName] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // ✅ Initialize the wallet manager and connector
  const { walletManager, account, connected, connectorRef, disconnect } =
    useWalletManager([
      //new XamanAdapter({ apiKey: "YOUR_API_KEY" }),
      new CrossmarkAdapter(),
    ]);

  // When the connection changes, update local UI state
  if (connected && account && !walletConnected) {
    setWalletConnected(true);
    setWalletAddress(account.address);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletConnected && companyName.trim()) {
      onAuth({ walletAddress, companyName: companyName.trim(), walletManager });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
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
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="text-2xl text-slate-100 mb-2">Enterprise Access</h2>
            <p className="text-slate-400">Connect your wallet to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-slate-300">XRPL Wallet</Label>

              {/* ✅ This replaces your custom buttons */}
              <div className="flex items-center gap-3">
                <xrpl-wallet-connector
                  ref={connectorRef}
                  id="wallet-connector"
                  primary-wallet="crossmark"
                ></xrpl-wallet-connector>

                {walletConnected && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await disconnect(); // ✅ wait for Crossmark to disconnect fully
                      } catch (e) {
                        console.warn("Disconnect error:", e);
                      } finally {
                        // ✅ then immediately reset UI
                        setWalletConnected(false);
                        setWalletAddress("");
                      }
                    }}
                    className="
                      border border-slate-600 
                      text-slate-300 
                      bg-slate-800/40 
                      hover:bg-slate-700/40 
                      hover:opacity-70 
                      hover:text-white 
                      transition-all 
                      duration-200
                    "
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>

            {walletConnected && (
              <>
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

                {/* ✅ New button to open the PaymentForm */}
                {/*
                <Button
                  type="button"
                  onClick={() => setShowPaymentForm((prev) => !prev)}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                >
                  {showPaymentForm ? "Hide Payment Form" : "Trigger Signature"}
                </Button>
                */}

                {/* ✅ Show PaymentForm if toggled */}
                {/*
                {showPaymentForm && walletConnected && (
                  <div className="mt-4 p-4 border border-teal-700/40 rounded-lg bg-slate-800/40">
                    <PaymentForm walletManager={walletManager} />
                  </div>
                )}*/}

                <Button
                  type="submit"
                  disabled={!companyName.trim()}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                >
                  Continue to Dashboard
                </Button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
