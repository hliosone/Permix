import { useState } from 'react';
import { DomainSelector } from './DomainSelector';
import { VerificationFlow } from './VerificationFlow';
import { PermissionedDEX } from './PermissionedDEX';
import { UserPortfolio } from './UserPortfolio';
import { 
  Wallet, 
  Globe, 
  ShieldCheck, 
  TrendingUp, 
  User as UserIcon,
  LogOut 
} from 'lucide-react';
import { Button } from './ui/button';
import { useDomains } from "../context/DomainContext";


interface UserDashboardProps {
  data: {
    walletAddress: string;
  };
  onLogout: () => void;
}

type UserStep = 'select-domain' | 'verify' | 'trading' | 'portfolio';

export function UserDashboard({ data, onLogout }: UserDashboardProps) {
  const {domains} = useDomains();
  const [currentStep, setCurrentStep] = useState<UserStep>('select-domain');
  const [selectedDomain, setSelectedDomain] = useState<{
    id: string;
    name: string;
    policy: string;
  } | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleDomainSelect = (domain: { id: string; name: string; policy: string }) => {
    setSelectedDomain(domain);
    setCurrentStep('verify');
  };

  const handleVerificationComplete = () => {
    setIsVerified(true);
    setCurrentStep('trading');
  };

  const steps = [
    { id: 'select-domain', label: 'Select Domain', icon: Globe },
    { id: 'verify', label: 'Verify Identity', icon: ShieldCheck },
    { id: 'trading', label: 'Trade', icon: TrendingUp },
    { id: 'portfolio', label: 'Portfolio', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h1 className="text-xl bg-gradient-to-r from-amber-400 to-teal-400 bg-clip-text text-transparent">
                    PermiX
                  </h1>
                  <p className="text-xs text-slate-500 font-mono">{data.walletAddress}</p>
                </div>
              </div>
              <Button
                onClick={onLogout}
                variant="ghost"
                className="text-slate-400 hover:text-slate-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-slate-800 bg-slate-900/30 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = 
                  (step.id === 'select-domain' && selectedDomain) ||
                  (step.id === 'verify' && isVerified) ||
                  (step.id === 'trading' && isVerified && currentStep === 'portfolio');
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => {
                        if (step.id === 'select-domain') setCurrentStep('select-domain');
                        if (step.id === 'trading' && isVerified) setCurrentStep('trading');
                        if (step.id === 'portfolio' && isVerified) setCurrentStep('portfolio');
                      }}
                      className={`flex items-center gap-2 ${
                        isActive
                          ? 'text-amber-400'
                          : isCompleted
                          ? 'text-teal-400'
                          : 'text-slate-500'
                      }`}
                      disabled={!isCompleted && !isActive}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          isActive
                            ? 'border-amber-400 bg-amber-400/20'
                            : isCompleted
                            ? 'border-teal-400 bg-teal-400/20'
                            : 'border-slate-700 bg-slate-800/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm hidden sm:inline">{step.label}</span>
                    </button>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          isCompleted ? 'bg-teal-400/30' : 'bg-slate-700'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {currentStep === 'select-domain' && (
            <DomainSelector onSelect={handleDomainSelect} domains={domains} />
          )}
          {currentStep === 'verify' && selectedDomain && (
            <VerificationFlow
              domain={selectedDomain}
              onComplete={handleVerificationComplete}
              onBack={() => setCurrentStep('select-domain')}
            />
          )}
          {currentStep === 'trading' && selectedDomain && (
            <PermissionedDEX
              domain={selectedDomain}
              onViewPortfolio={() => setCurrentStep('portfolio')}
            />
          )}
          {currentStep === 'portfolio' && selectedDomain && (
            <UserPortfolio
              domain={selectedDomain}
              onBackToTrading={() => setCurrentStep('trading')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
