import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, User, RefreshCw, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { toast } from 'sonner';
import { Client, Wallet } from 'xrpl';

interface PermissionedDEXProps {
  domain: {
    id: string;
    name: string;
    policy: string;
  };
  onViewPortfolio: () => void;
  orderBookData?: any;
  accountOffers?: any[];
  loading?: boolean;
  onRefreshNeeded?: () => void;
}

export function PermissionedDEX({ 
  domain, 
  onViewPortfolio,
  orderBookData,
  accountOffers = [],
  loading = false,
  onRefreshNeeded
}: PermissionedDEXProps) {
  const [selectedPair, setSelectedPair] = useState('DDD/CCC');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [xrplClient, setXrplClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Retrieve environment variables
  const user2Address = (import.meta as any).env?.VITE_KYC_USER_2_ADDR || '';
  const user2Seed = (import.meta as any).env?.VITE_KYC_USER_2_SEED || '';
  const domainId = 'D04BB88665B23434A0B814E6F12F66CC2C91AEA6CB0736B08988BFB0FA86A1B9';

  // Initialize XRPL client
  useEffect(() => {
    const initClient = async () => {
      try {
        const client = new Client('wss://s.devnet.rippletest.net:51233');
        await client.connect();
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

  const tradingPairs = [
    { pair: 'DDD/CCC', price: '0.909091', change: '-', volume: '-' },
  ];

  // Parse account offers to display in orderbook
  const parseOrderBook = () => {
    console.log('=== PARSING ACCOUNT OFFERS ===');
    console.log('accountOffers:', accountOffers);
    console.log('orderBookData:', orderBookData);
    
    // Use accountOffers instead of orderBookData since that's where the data is
    const offersToProcess = accountOffers.length > 0 ? accountOffers : (orderBookData?.offers || []);
    
    if (offersToProcess.length === 0) {
      console.log('No offers available');
      return { bids: [], asks: [] };
    }

    console.log('Processing', offersToProcess.length, 'offers');

    const asks: any[] = [];
    const bids: any[] = [];

    offersToProcess.forEach((offer: any, idx: number) => {
      console.log(`\n--- Offer ${idx} ---`);
      
      // Account offers use TakerGets/TakerPays (uppercase)
      const takerGets = offer.TakerGets || offer.taker_gets;
      const takerPays = offer.TakerPays || offer.taker_pays;

      if (!takerGets || !takerPays) {
        console.log('❌ Missing data');
        return;
      }

      // Extract currency info
      const getsCurrency = typeof takerGets === 'string' ? 'XRP' : takerGets.currency;
      const paysCurrency = typeof takerPays === 'string' ? 'XRP' : takerPays.currency;
      const getsValue = typeof takerGets === 'string' ? takerGets : takerGets.value;
      const paysValue = typeof takerPays === 'string' ? takerPays : takerPays.value;

      console.log('Currencies:', { getsCurrency, paysCurrency });
      console.log('Values:', { getsValue, paysValue });

      // Selling DDD for CCC: TakerGets=CCC, TakerPays=DDD
      if (getsCurrency === 'CCC' && paysCurrency === 'DDD') {
        const dddAmount = paysValue;
        const cccAmount = getsValue;
        const price = parseFloat(cccAmount) / parseFloat(dddAmount);
        
        console.log('✅ SELL ORDER (Ask):', { price, dddAmount, cccAmount });
        asks.push({
          price: price.toFixed(6),
          amount: dddAmount,
          total: cccAmount,
          Account: offer.Account,
          Sequence: offer.Sequence || offer.seq,
        });
      }
      // Buying DDD with CCC: TakerGets=DDD, TakerPays=CCC
      else if (getsCurrency === 'DDD' && paysCurrency === 'CCC') {
        const dddAmount = getsValue;
        const cccAmount = paysValue;
        const price = parseFloat(cccAmount) / parseFloat(dddAmount);
        
        console.log('✅ BUY ORDER (Bid):', { price, dddAmount, cccAmount });
        bids.push({
          price: price.toFixed(6),
          amount: dddAmount,
          total: cccAmount,
          Account: offer.Account,
          Sequence: offer.Sequence || offer.seq,
        });
      } else {
        console.log('⚠️ Other pair:', { getsCurrency, paysCurrency });
      }
    });

    console.log('\n=== RESULT ===');
    console.log('Asks:', asks.length, asks);
    console.log('Bids:', bids.length, bids);

    return {
      asks: asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
      bids: bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)),
    };
  };

  const orderBook = parseOrderBook();

  const recentTrades = [
    { price: '1.0234', amount: '234.56', time: '14:23:45', type: 'buy' },
    { price: '1.0235', amount: '1,234.00', time: '14:23:42', type: 'sell' },
    { price: '1.0233', amount: '567.89', time: '14:23:38', type: 'buy' },
    { price: '1.0234', amount: '890.12', time: '14:23:35', type: 'buy' },
    { price: '1.0236', amount: '456.78', time: '14:23:30', type: 'sell' },
  ];

  const handlePlaceOrder = async () => {
    if (!amount || !price) {
      toast.error('Please enter amount and price');
      return;
    }

    if (!xrplClient || !user2Address || !user2Seed) {
      toast.error('Wallet not connected');
      return;
    }

    setSubmitting(true);

    try {
      const wallet = Wallet.fromSeed(user2Seed);
      
      // Calculate TakerGets and TakerPays based on order type
      // For DDD/CCC pair: Base=DDD, Quote=CCC
      let takerGets, takerPays;
      
      if (orderType === 'sell') {
        // Selling DDD for CCC
        // TakerGets = what they give you (CCC) = amount * price
        // TakerPays = what you give them (DDD) = amount
        takerGets = {
          currency: 'CCC',
          issuer: user2Address,
          value: (parseFloat(amount) * parseFloat(price)).toFixed(6),
        };
        takerPays = {
          currency: 'DDD',
          issuer: user2Address,
          value: amount,
        };
      } else {
        // Buying DDD with CCC
        // TakerGets = what they give you (DDD) = amount
        // TakerPays = what you give them (CCC) = amount * price
        takerGets = {
          currency: 'DDD',
          issuer: user2Address,
          value: amount,
        };
        takerPays = {
          currency: 'CCC',
          issuer: user2Address,
          value: (parseFloat(amount) * parseFloat(price)).toFixed(6),
        };
      }

      const offerTx = {
        TransactionType: 'OfferCreate',
        Account: wallet.address,
        TakerGets: takerGets,
        TakerPays: takerPays,
        DomainID: domainId,
      };

      console.log('Creating offer:', offerTx);

      const prepared = await xrplClient.autofill(offerTx as any);
      const signed = wallet.sign(prepared);
      const result = await xrplClient.submitAndWait(signed.tx_blob);

      const txResult = (result.result as any)?.meta?.TransactionResult || 'Unknown';

      if (txResult === 'tesSUCCESS') {
        toast.success(`${orderType === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
        setAmount('');
        setPrice('');
        
        // Trigger refresh in parent component
        if (onRefreshNeeded) {
          console.log('✅ Order placed, requesting parent to refresh data');
          setTimeout(() => {
            onRefreshNeeded();
          }, 2000); // Wait 2 seconds for ledger to update
        }
      } else {
        toast.error(`Order failed: ${txResult}`);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(`Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-slate-100 mb-1">Permissioned DEX</h2>
          <p className="text-slate-400">Trading in {domain.name}</p>
        </div>
        <Button
          onClick={onViewPortfolio}
          variant="outline"
          className="border-slate-700 text-slate-300"
        >
          <User className="w-4 h-4 mr-2" />
          View Portfolio
        </Button>
      </div>

      {/* Trading Pairs */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {tradingPairs.map((pair) => (
          <button
            key={pair.pair}
            onClick={() => setSelectedPair(pair.pair)}
            className={`flex-shrink-0 p-4 rounded-lg border transition-all ${
              selectedPair === pair.pair
                ? 'bg-teal-500/10 border-teal-500/50'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-100">{pair.pair}</span>
              <Badge
                className={
                  pair.change.startsWith('+')
                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }
              >
                {pair.change}
              </Badge>
            </div>
            <div className="text-left">
              <p className="text-xl text-slate-100">{pair.price}</p>
              <p className="text-xs text-slate-500">Vol: {pair.volume}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Book */}
        <Card className="lg:col-span-1 bg-slate-900/50 border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-slate-100">Order Book</h3>
            {loading && <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />}
          </div>
          
          {/* Debug Info */}
          <div className="mb-4 p-2 bg-teal-500/10 border border-teal-500/30 rounded text-xs text-teal-400">
            Account Offers: {accountOffers.length} | 
            Orderbook: {orderBookData?.offers?.length || 0} | 
            Displaying: {orderBook.asks.length} asks, {orderBook.bids.length} bids
          </div>
          
          {!orderBookData?.offers && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
              Waiting for orderbook data...
            </div>
          )}

          {/* Raw Data Display for Debugging */}
          {orderBookData?.offers && orderBookData.offers.length > 0 && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
              <div className="font-bold text-blue-400 mb-2">Raw Offer Data:</div>
              {orderBookData.offers.slice(0, 3).map((offer: any, idx: number) => (
                <div key={idx} className="text-blue-300 mb-2 font-mono">
                  {idx}: {JSON.stringify({
                    taker_gets: offer.taker_gets || offer.TakerGets,
                    taker_pays: offer.taker_pays || offer.TakerPays,
                    quality: offer.quality,
                  }, null, 2).substring(0, 200)}
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Asks (Sell Orders) */}
            <div>
              <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-slate-500">
                <span>Price (CCC)</span>
                <span className="text-right">Amount (DDD)</span>
                <span className="text-right">Total (CCC)</span>
              </div>
              <div className="space-y-1">
                {orderBook.asks.length > 0 ? (
                  orderBook.asks.map((order: any, index: number) => (
                    <div key={index} className="grid grid-cols-3 gap-2 text-sm">
                      <span className="text-red-400">{order.price}</span>
                      <span className="text-slate-300 text-right">{order.amount}</span>
                      <span className="text-slate-400 text-right text-xs">{order.total}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 text-sm py-2">No sell orders</div>
                )}
              </div>
            </div>

            {/* Spread */}
            <div className="py-2 text-center border-y border-slate-800">
              {orderBook.bids.length > 0 || orderBook.asks.length > 0 ? (
                <>
                  <span className="text-lg text-teal-400">
                    {orderBook.bids[0]?.price || orderBook.asks[0]?.price || '0.909091'}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">DDD/CCC</span>
                </>
              ) : (
                <span className="text-sm text-slate-500">No orders yet</span>
              )}
            </div>

            {/* Bids (Buy Orders) */}
            <div>
              <div className="space-y-1">
                {orderBook.bids.length > 0 ? (
                  orderBook.bids.map((order: any, index: number) => (
                    <div key={index} className="grid grid-cols-3 gap-2 text-sm">
                      <span className="text-teal-400">{order.price}</span>
                      <span className="text-slate-300 text-right">{order.amount}</span>
                      <span className="text-slate-400 text-right text-xs">{order.total}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 text-sm py-2">No buy orders</div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Trading Interface */}
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'buy' | 'sell')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="buy" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
                <TrendingUp className="w-4 h-4 mr-2" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                <TrendingDown className="w-4 h-4 mr-2" />
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4">
              <div className="space-y-2">
                <Label>Price (CCC per DDD)</Label>
                <Input
                  type="number"
                  placeholder="0.909091"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Amount (DDD)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>

              <div className="p-3 bg-slate-800/30 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Total</span>
                  <span className="text-slate-100">
                    {amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(6) : '0.00'} CCC
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">You're buying</span>
                  <span className="text-slate-100">
                    {amount || '0.00'} DDD
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={submitting || !amount || !price}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Buy Order
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-2">
                <Label>Price (CCC per DDD)</Label>
                <Input
                  type="number"
                  placeholder="0.909091"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Amount (DDD)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>

              <div className="p-3 bg-slate-800/30 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Total</span>
                  <span className="text-slate-100">
                    {amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(6) : '0.00'} CCC
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">You're selling</span>
                  <span className="text-slate-100">
                    {amount || '0.00'} DDD
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={submitting || !amount || !price}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Sell Order
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
            <p className="text-xs text-teal-300/80">
              ✓ Credential verified • Trading enabled in this domain
            </p>
          </div>
        </Card>

        {/* Recent Trades */}
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-slate-100">Recent Trades</h3>
            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-slate-200">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-slate-500">
              <span>Price</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Time</span>
            </div>
            <div className="space-y-2">
              {recentTrades.map((trade, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-2 text-sm p-2 bg-slate-800/20 rounded"
                >
                  <span className={trade.type === 'buy' ? 'text-teal-400' : 'text-red-400'}>
                    {trade.price}
                  </span>
                  <span className="text-slate-300 text-right">{trade.amount}</span>
                  <span className="text-slate-500 text-right text-xs">{trade.time}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
