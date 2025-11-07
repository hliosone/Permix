import { useState } from 'react';
import { PolicyBuilder } from './PolicyBuilder';
import { DomainCreator } from './DomainCreator';
import { AssetCreator } from './AssetCreator';
import { PermissionDelegation } from './PermissionDelegation';
import { DashboardOverview } from './DashboardOverview';
import { PolicyProvider } from "../context/PolicyContext"; 
import { DomainProvider } from "../context/DomainContext";

import { 
  LayoutDashboard, 
  FileText, 
  Globe, 
  Coins, 
  ShieldCheck, 
  LogOut,
  Wallet
} from 'lucide-react';
import { Button } from './ui/button';

interface EnterpriseDashboardProps {
  data: {
    walletAddress: string;
    companyName: string;
  };
  onLogout: () => void;
}

type Tab = 'dashboard' | 'policies' | 'domains' | 'assets' | 'delegation';

export function EnterpriseDashboard({ data, onLogout }: EnterpriseDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'policies' as Tab, label: 'Policies', icon: FileText },
    { id: 'domains' as Tab, label: 'Domains', icon: Globe },
    { id: 'assets' as Tab, label: 'Assets', icon: Coins },
    { id: 'delegation' as Tab, label: 'Delegation', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-slate-900/50 backdrop-blur border-r border-slate-800 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-slate-950" />
              </div>
              <h1 className="text-2xl bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">
                PermiX
              </h1>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 text-sm">{data.companyName}</p>
              <p className="text-slate-500 text-xs font-mono truncate">
                {data.walletAddress}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-800">
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <PolicyProvider>
            <DomainProvider>
              <div className="p-8">
                {activeTab === "dashboard" && (
                  <DashboardOverview companyName={data.companyName} />
                )}
                {activeTab === "policies" && <PolicyBuilder />}
                {activeTab === "domains" && <DomainCreator />}
                {activeTab === "assets" && <AssetCreator />}
                {activeTab === "delegation" && <PermissionDelegation />}
              </div>
            </DomainProvider>
          </PolicyProvider>
        </div>
      </div>
    </div>
  );
}
