import { useState } from 'react';
import { EnterpriseLogin } from './components/EnterpriseLogin';
import { UserLogin } from './components/UserLogin';
import { EnterpriseDashboard } from './components/EnterpriseDashboard';
import { UserDashboard } from './components/UserDashboard';
import { Wallet, Building2, User } from 'lucide-react';
import { Button } from './components/ui/button';
import { DomainProvider } from "./context/DomainContext";

type UserRole = "enterprise" | "user" | null;

interface EnterpriseData {
  walletAddress: string;
  companyName: string;
  walletManager: any;
}

interface UserData {
  walletAddress: string;
}

export default function App() {
  const [role, setRole] = useState<UserRole>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enterpriseData, setEnterpriseData] = useState<EnterpriseData | null>(
    null
  );
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleEnterpriseAuth = (data: EnterpriseData) => {
    setEnterpriseData(data);
    setIsAuthenticated(true);
  };

  const handleUserAuth = (data: UserData) => {
    setUserData(data);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setEnterpriseData(null);
    setUserData(null);
  };

  // Role selection screen
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-5xl">
          {/* Logo and Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-7 h-7 text-slate-950" />
              </div>
              <h1 className="text-5xl bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">
                PermiX
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              No-code regulated DeFi environments on XRP Ledger
            </p>
            <p className="text-slate-500 mt-2">
              Build compliant permissioned domains with verifiable credentials
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Enterprise Card */}
            <button
              onClick={() => setRole("enterprise")}
              className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-teal-500/50 transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Building2 className="w-8 h-8 text-teal-400" />
                </div>

                <h2 className="text-2xl text-slate-100 mb-3">Enterprise</h2>
                <p className="text-slate-400 mb-6">
                  Create policies, issue credentials, and manage permissioned
                  trading domains
                </p>

                <ul className="space-y-2 mb-8">
                  <li className="flex items-start gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-1.5" />
                    <span>Build access rules with visual policy builder</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-1.5" />
                    <span>Create compliant assets and domains</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-1.5" />
                    <span>Delegate permissions and monitor activity</span>
                  </li>
                </ul>

                <div className="flex items-center gap-2 text-teal-400 group-hover:gap-3 transition-all">
                  <span>Get Started</span>
                  <span className="text-xl">→</span>
                </div>
              </div>
            </button>

            {/* User Card */}
            <button
              onClick={() => setRole("user")}
              className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-amber-500/50 transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-amber-400" />
                </div>

                <h2 className="text-2xl text-slate-100 mb-3">User</h2>
                <p className="text-slate-400 mb-6">
                  Join permissioned domains, verify identity, and trade
                  compliant assets
                </p>

                <ul className="space-y-2 mb-8">
                  <li className="flex items-start gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5" />
                    <span>Connect wallet and select domains</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5" />
                    <span>Verify identity with OID4VP credentials</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5" />
                    <span>Access permissioned DEX and trade</span>
                  </li>
                </ul>

                <div className="flex items-center gap-2 text-amber-400 group-hover:gap-3 transition-all">
                  <span>Get Started</span>
                  <span className="text-xl">→</span>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-slate-500 text-sm">
            Powered by XRP Ledger • Verifiable Credentials • Permission
            Delegation
          </div>
        </div>
      </div>
    );
  }

  // Enterprise Flow
  if (role === "enterprise") {
    if (!isAuthenticated) {
      return (
        <EnterpriseLogin
          onAuth={handleEnterpriseAuth}
          onBack={() => setRole(null)}
        />
      );
    }
    return (
      <EnterpriseDashboard
        data={{
          walletAddress: enterpriseData!.walletAddress,
          companyName: enterpriseData!.companyName,
          walletManager: enterpriseData!.walletManager, // 🟩 add this
        }}
        onLogout={handleLogout}
      />
    );
  }

  // User Flow
  if (role === "user") {
    if (!isAuthenticated) {
      return <UserLogin onAuth={handleUserAuth} onBack={() => setRole(null)} />;
    }
    return (
      <DomainProvider>
        <UserDashboard data={userData!} onLogout={handleLogout} />
      </DomainProvider>
    );
  }

  return null;
}
