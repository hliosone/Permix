import { useState } from 'react';
import { Coins, Plus, Lock, Snowflake, RotateCcw, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { Client, Wallet } from "xrpl";

interface Asset {
  id: string;
  name: string;
  code: string;
  description: string;
  flags: {
    requireAuth: boolean;
    freeze: boolean;
    clawback: boolean;
  };
  preset: string;
  issuer: string;
  supply: string;
  holders: number;
  createdAt: string;
}

interface AssetCreatorProps {
  // 🟢 optionally accept walletManager prop
  walletManager: any;
}

export function AssetCreator({ walletManager }: AssetCreatorProps) {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "1",
      name: "Euro Stablecoin",
      code: "EURC",
      description: "Mi4CA-compliant euro-backed stablecoin",
      flags: {
        requireAuth: true,
        freeze: true,
        clawback: true,
      },
      preset: "MiCA",
      issuer: "rN7n7otQDd6FczFgLdOqDdqu7h3oMVUi9M",
      supply: "€5,234,567",
      holders: 432,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [ripplingEnabled, setRipplingEnabled] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    code: "",
    description: "",
    flags: {
      requireAuth: false,
      freeze: false,
      clawback: false,
    },
    preset: "Custom",
  });
  const [hasBeenChecked, setHasBeenChecked] = useState(
    newAsset.flags.requireAuth
  );

  const walletAddress = "rfbsmVCbmAqPsCNRQNDoDAvMSQJwBvMTyn";

  const presets = [
    {
      name: "MiCA",
      description: "EU Markets in Crypto-Assets regulation",
      flags: { requireAuth: true, freeze: true, clawback: true },
    },

    {
      name: "Custom",
      description: "Configure flags manually",
      flags: { requireAuth: false, freeze: false, clawback: false },
    },
  ];

  const selectPreset = (presetName: string) => {
    const preset = presets.find((p) => p.name === presetName);
    if (preset) {
      setNewAsset({
        ...newAsset,
        preset: presetName,
        flags: { ...preset.flags },
      });
    }
  };

  const handleCheck = async (checked) => {
    if (hasBeenChecked && !checked) return;

    const domainCreatorAddress = walletManager.account.address;
    const flags = [];
    flags.push(2);
    const tx = {
      TransactionType: "AccountSet",
      Account: domainCreatorAddress,
      SetFlag: flags[0],
    };

    try {
      console.log("🔁 Submitting TX:", tx);
      const result = await walletManager.signAndSubmit(tx);
      console.log("✅ XRPL TX result:", result);

      toast.success("Domain successfully created on XRPL!");
      setNewAsset({
        ...newAsset,
        flags: {
          ...newAsset.flags,
          requireAuth: checked as boolean,
        },
        preset: "Custom",
      });

      if (checked) setHasBeenChecked(true);

      // Update your frontend UI state
      //createDomain();
    } catch (e) {
      console.error("💥 Error creating domain:", e);
      toast.error("Failed to create domain on XRPL");
    }
  };

  const createAsset = async () => {
    if (!newAsset.name.trim() || !newAsset.code.trim()) {
      toast.error("Please enter asset name and code");
      return;
    }

    let quantity = "100";

    // For some weird reason, Crossmark wallet rejects TrustSet with Account other than 
    // wallet manager account address

    

    const SetTrust = 
      {
        TransactionType: "TrustSet",
        Account: walletAddress,
        LimitAmount: {
          currency: newAsset.code,
          issuer: walletManager.account.address,
          value: quantity,
        },
      }

    const client = new Client('wss://s.devnet.rippletest.net:51233');
    await client.connect();

    // WE DID THIS because Crossmark doesn't support for the moment the PermissionDomainSet transaction
    // TODO: remplace la seed dans fromSeed par une variable de seed du wallet d'entreprise
    const permissionedDelegateMockWallet =
        Wallet.fromSeed("sEdTQ8FaY5rW8rMGZep3i1dZXavMBVc"); // KYC Issuer

        try {
            const response = await client.submitAndWait(SetTrust, {
                autofill: true,
                wallet: permissionedDelegateMockWallet,
            });

            return response.result // si cest tesSUCCESS cest good sinon autre cest non

        } catch (error) {
            //console.log( Error: ${error.message});
            await client.disconnect();
        }
    await client.disconnect();

    try {
      //const result = await walletManager.signAndSubmit(trustSetTx);
      //console.log("✅ XRPL TX result:", result);

      toast.success("Domain successfully created on XRPL!");

      const asset: Asset = {
        id: Date.now().toString(),
        ...newAsset,
        issuer: walletManager.account.address,
        supply: quantity,
        holders: 0,
        createdAt: new Date().toISOString(),
      };

      setAssets([...assets, asset]);
      toast.success("Asset created and transaction submitted!");

      // Update your frontend UI state
      //createDomain();
    } catch (e) {
      console.error("💥 Error creating domain:", e);
      toast.error("Failed to create domain on XRPL");
    }

    setNewAsset({
      name: "",
      code: "",
      description: "",
      flags: {
        requireAuth: false,
        freeze: false,
        clawback: false,
      },
      preset: "Custom",
    });
    setHasBeenChecked(false);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-slate-100 mb-2">Asset Management</h2>
          <p className="text-slate-400">
            Create and manage compliant tokens (IOUs) on XRP Ledger
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={async () => {
              const domainCreatorAddress = walletManager.account.address;
              const tx = {
                TransactionType: "AccountSet",
                Account: domainCreatorAddress,
                SetFlag: 8, // Enable Rippling
              };

              try {
                console.log("🔁 Submitting TX:", tx);
                const result = await walletManager.signAndSubmit(tx);
                console.log("✅ XRPL TX result:", result);

                toast.success("Domain successfully created on XRPL!");
                if (!ripplingEnabled) {
                  setRipplingEnabled(true);
                  toast.success("Rippling enabled successfully!");
                }

                // Update your frontend UI state
                //createDomain();
              } catch (e) {
                console.error("💥 Error creating domain:", e);
                toast.error("Failed to create domain on XRPL");
              }
            }}
            disabled={ripplingEnabled}
            className={
              ripplingEnabled
                ? "!bg-emerald-500 !text-white border-2 !border-emerald-300 cursor-default !hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                : "!bg-gradient-to-r !from-amber-500 !to-amber-600 hover:!from-amber-600 hover:!to-amber-700 !text-white"
            }
          >
            {ripplingEnabled ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Rippling Enabled
              </>
            ) : (
              "Enable Rippling"
            )}
          </Button>
          <Button
            onClick={() => setIsCreating(true)}
            disabled={!ripplingEnabled}
            className={
              ripplingEnabled
                ? "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Asset
          </Button>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid gap-4">
        {assets.map((asset) => (
          <Card key={asset.id} className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg text-slate-100">{asset.name}</h3>
                    <code className="px-2 py-0.5 bg-slate-800 text-amber-400 rounded text-sm">
                      {asset.code}
                    </code>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">
                    {asset.description}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    Issuer: {asset.issuer}
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {asset.preset}
              </Badge>
            </div>

            {/* Flags */}
            <div className="flex gap-2 mb-4">
              {asset.flags.requireAuth && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                  <Lock className="w-3 h-3" />
                  <span>RequireAuth</span>
                </div>
              )}
              {asset.flags.freeze && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400">
                  <Snowflake className="w-3 h-3" />
                  <span>Freeze</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Supply</p>
                <p className="text-lg text-slate-100">{asset.supply}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Holders</p>
                <p className="text-lg text-slate-100">{asset.holders}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Asset Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Asset</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset Name</Label>
                <Input
                  placeholder="e.g., Euro Stablecoin"
                  value={newAsset.name}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, name: e.target.value })
                  }
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency Code</Label>
                <Input
                  placeholder="e.g., EURC"
                  value={newAsset.code}
                  onChange={(e) =>
                    setNewAsset({
                      ...newAsset,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="bg-slate-800/50 border-slate-700"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the asset..."
                value={newAsset.description}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, description: e.target.value })
                }
                className="bg-slate-800/50 border-slate-700 min-h-20"
              />
            </div>

            {/* Compliance Presets */}
            <div className="space-y-3">
              <Label>Compliance Preset</Label>
              <div className="grid gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => selectPreset(preset.name)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      newAsset.preset === preset.name
                        ? "border-teal-500/50 bg-teal-500/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-100">{preset.name}</span>
                      {newAsset.preset === preset.name && (
                        <Check className="w-4 h-4 text-teal-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <Label>Asset Flags</Label>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    checked={newAsset.flags.requireAuth}
                    onCheckedChange={handleCheck}
                    disabled={hasBeenChecked}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-200">Require Auth</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Users must be authorized before holding this asset
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Snowflake className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-200">Freeze</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      You will be able to frereze assets
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsCreating(false)}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={createAsset}
                className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
              >
                <Coins className="w-4 h-4 mr-2" />
                Create Asset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}