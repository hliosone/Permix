import React, { useState, useEffect } from 'react';
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
import { Client, Wallet as XRPLWallet } from 'xrpl';

// Helper: Get domain ID from ledger
const getDomainId = async (client: Client, ownerAddress: string, sequence: number): Promise<string | null> => {
  try {
    const accountObjects = await client.request({
      command: "account_objects",
      account: ownerAddress,
      ledger_index: "validated",
      type: "permissioned_domain"
    });
    
    const domain = (accountObjects.result as any).account_objects.find((obj: any) => 
      obj.Sequence === sequence
    );
    
    return domain?.index || null;
  } catch (error: any) {
    console.log(`Error fetching domain ID: ${error?.message}`);
    return null;
  }
};

// Helper: Get order book from XRPL - gets ALL offers from the orderbook
const getOrderBook = async (
  client: Client,
  baseCurrency: string,
  baseIssuer: string | undefined,
  quoteCurrency: string,
  quoteIssuer: string | undefined,
  limit: number = 50
) => {
  try {
    const takerPays = baseCurrency === 'XRP' 
      ? 'XRP' 
      : { currency: baseCurrency, issuer: baseIssuer };

    const takerGets = quoteCurrency === 'XRP'
      ? 'XRP'
      : { currency: quoteCurrency, issuer: quoteIssuer };

    console.log('Fetching order book with:', { takerPays, takerGets });

    const orderBookResponse = await client.request({
      command: 'book_offers',
      taker_pays: takerPays as any,
      taker_gets: takerGets as any,
      ledger_index: 'validated',
      limit,
    } as any);

    const offers = (orderBookResponse.result as any).offers || [];
    console.log(`Found ${offers.length} total offers in orderbook`);

    return { success: true, offers };
  } catch (error: any) {
    console.error('Error fetching order book:', error);
    return { success: false, offers: [], error: error?.message };
  }
};

// Helper: Get account offers
const getAccountOffers = async (client: Client, accountAddress: string, domainId?: string) => {
  try {
    const accountOffersResponse = await client.request({
      command: 'account_offers',
      account: accountAddress,
      ledger_index: 'validated',
    });

    let offers = (accountOffersResponse.result as any).offers || [];
    
    if (domainId) {
      offers = offers.filter((offer: any) => offer.DomainID === domainId);
    }

    return { success: true, offers };
  } catch (error: any) {
    console.error('Error fetching account offers:', error);
    return { success: false, offers: [], error: error?.message };
  }
};

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
  
  // Retrieve environment variables
  const user2Address = (import.meta as any).env?.VITE_KYC_USER_2_ADDR || '';
  const user2Seed = (import.meta as any).env?.VITE_KYC_USER_2_SEED || '';
  
  // Log environment variables for debugging
  useEffect(() => {
    console.log('User 2 Address from .env:', user2Address);
    console.log('User 2 Seed from .env:', user2Seed ? '***' + user2Seed.slice(-4) : 'Not set');
  }, [user2Address, user2Seed]);
  
  // State for orderbook data
  const [orderBookData, setOrderBookData] = useState<any>(null);
  const [accountOffers, setAccountOffers] = useState<any[]>([]);
  const [xrplClient, setXrplClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDomainSelect = (domain: { id: string; name: string; policy: string }) => {
    setSelectedDomain(domain);
    setCurrentStep('verify');
  };

  const handleVerificationComplete = () => {
    setIsVerified(true);
    setCurrentStep('trading');
  };

  // Refresh orderbook data
  const handleRefreshOrderbook = async () => {
    if (!xrplClient || !user2Address) return;
    
    console.log('🔄 Refreshing orderbook data...');
    setLoading(true);
    
    try {
      const domainId = 'D04BB88665B23434A0B814E6F12F66CC2C91AEA6CB0736B08988BFB0FA86A1B9';
      
      // Fetch account offers
      const offersResult = await getAccountOffers(xrplClient, user2Address);
      if (offersResult.success && offersResult.offers) {
        setAccountOffers(offersResult.offers);
        console.log('✅ Refreshed account offers:', offersResult.offers.length);
      }

      // Fetch orderbook in both directions
      const sellOrdersResult = await getOrderBook(xrplClient, 'DDD', user2Address, 'CCC', user2Address, 50);
      const buyOrdersResult = await getOrderBook(xrplClient, 'CCC', user2Address, 'DDD', user2Address, 50);
      
      const allOffers = [
        ...(sellOrdersResult.offers || []),
        ...(buyOrdersResult.offers || []),
      ];
      
      const domainOrderBookOffers = allOffers.filter((offer: any) => offer.DomainID === domainId);
      
      setOrderBookData({
        success: true,
        offers: domainOrderBookOffers,
        allOffers: allOffers,
      });
      
      console.log('✅ Refreshed orderbook:', domainOrderBookOffers.length);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize XRPL client on mount
  useEffect(() => {
    const initClient = async () => {
      try {
        const client = new Client('wss://s.devnet.rippletest.net:51233');
        await client.connect();
        console.log('Connected to XRPL Devnet');
        setXrplClient(client);
      } catch (error) {
        console.error('Failed to initialize XRPL client:', error);
      }
    };
    initClient();

    return () => {
      if (xrplClient) {
        xrplClient.disconnect();
      }
    };
  }, []);

  // Fetch orderbook data when trading view is active
  useEffect(() => {
    const fetchOrderBookData = async () => {
      if (!xrplClient || !user2Address) {
        return;
      }

      setLoading(true);
      try {
        // Use the actual domain ID from the offer
        const domainId = 'D04BB88665B23434A0B814E6F12F66CC2C91AEA6CB0736B08988BFB0FA86A1B9';
        
        console.log('Using Domain ID:', domainId);
        console.log('Fetching orderbook for user:', user2Address);

        // Fetch account offers for the user (no domain filter to see all offers)
        const offersResult = await getAccountOffers(xrplClient, user2Address);
        if (offersResult.success && offersResult.offers) {
          setAccountOffers(offersResult.offers);
          console.log('All account offers:', offersResult.offers);
          
          // Filter for domain-specific offers
          const domainOffers = offersResult.offers.filter((offer: any) => offer.DomainID === domainId);
          console.log('Domain-specific offers:', domainOffers);
        }

        // Fetch orderbook in BOTH directions to get all buy and sell orders
        
        // Direction 1: Selling DDD for CCC (TakerPays=DDD, TakerGets=CCC)
        console.log('\n📊 Fetching orderbook: Selling DDD for CCC');
        const sellOrdersResult = await getOrderBook(
          xrplClient,
          'DDD',
          user2Address,
          'CCC',
          user2Address,
          50
        );

        // Direction 2: Buying DDD with CCC (TakerPays=CCC, TakerGets=DDD)
        console.log('\n📊 Fetching orderbook: Buying DDD with CCC');
        const buyOrdersResult = await getOrderBook(
          xrplClient,
          'CCC',
          user2Address,
          'DDD',
          user2Address,
          50
        );

        // Combine all offers from both directions
        const allOffers = [
          ...(sellOrdersResult.offers || []),
          ...(buyOrdersResult.offers || []),
        ];

        console.log(`Found ${sellOrdersResult.offers?.length || 0} sell-side offers`);
        console.log(`Found ${buyOrdersResult.offers?.length || 0} buy-side offers`);
        console.log(`Total: ${allOffers.length} offers`);
        
        // Log each offer for debugging
        allOffers.forEach((offer: any, idx: number) => {
          console.log(`Offer ${idx}:`, {
            Account: offer.Account,
            TakerGets: offer.TakerGets,
            TakerPays: offer.TakerPays,
            DomainID: offer.DomainID,
            taker_gets: offer.taker_gets,
            taker_pays: offer.taker_pays,
          });
        });
        
        // Filter for domain-specific offers manually
        const domainOrderBookOffers = allOffers.filter(
          (offer: any) => offer.DomainID === domainId
        );
        
        console.log(`Found ${domainOrderBookOffers.length} offers for domain ${domainId}`);
        
        setOrderBookData({
          success: true,
          offers: domainOrderBookOffers,
          allOffers: allOffers, // Keep all offers for debugging
        });
      } catch (error) {
        console.error('Failed to fetch orderbook data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentStep === 'trading' && xrplClient) {
      fetchOrderBookData();
    }
  }, [xrplClient, currentStep, user2Address]);

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
                  <p className="text-xs text-slate-500 font-mono">
                    {user2Address || data.walletAddress}
                  </p>
                  {user2Address && (
                    <p className="text-xs text-slate-600 font-mono mt-1">
                      User 2 (from .env)
                    </p>
                  )}
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
              orderBookData={orderBookData}
              accountOffers={accountOffers}
              loading={loading}
              onRefreshNeeded={handleRefreshOrderbook}
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
