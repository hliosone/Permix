// PaymentForm.tsx
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

export default function PaymentForm({ walletManager }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [destination, setDestination] = useState(
    "rM9Yrz91jnPLk3NXQvTs6FcVCB4qqkkvaW"
  );
  const [amount, setAmount] = useState("1000000");

  const sendPayment = async () => {
    if (!walletManager?.connected) {
      setError("Wallet not connected");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const tx = {
        TransactionType: "Payment",
        Account: walletManager.account.address,
        Destination: destination,
        Amount: amount,
      };
      const res = await walletManager.signAndSubmit(tx);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 bg-slate-900/60 border border-slate-700 rounded-lg p-4">
      {/* inputs ... */}
      <Button
        type="button" // ✅ not submit
        onClick={sendPayment} // ✅ no form submit
        disabled={loading || !walletManager?.connected}
        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
      >
        {loading ? "Sending..." : "Send Payment"}
      </Button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {result && (
        <div className="text-green-400 text-sm break-all">
          ✅ Success! Tx Hash: {result.hash || "Pending..."}
        </div>
      )}
    </div>
  );
}
