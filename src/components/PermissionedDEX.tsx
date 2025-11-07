import { useState } from 'react';
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
import { toast } from 'sonner@2.0.3';

interface PermissionedDEXProps {
  domain: {
    id: string;
    name: string;
    policy: string;
  };
  onViewPortfolio: () => void;
}

export function PermissionedDEX({ domain, onViewPortfolio }: PermissionedDEXProps) {
  const [selectedPair, setSelectedPair] = useState('EURC/RLUSD');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  const tradingPairs = [
    { pair: 'EURC/RLUSD', price: '1.0234', change: '+0.12%', volume: '€234,567' },
    { pair: 'EURX/XRP', price: '0.4821', change: '-0.08%', volume: '€189,432' },
    { pair: 'USDC/RLUSD', price: '1.0001', change: '+0.01%', volume: '$567,890' },
  ];

  const orderBook = {
    bids: [
      { price: '1.0234', amount: '5,234', total: '5,354.48' },
      { price: '1.0233', amount: '12,567', total: '12,861.79' },
      { price: '1.0232', amount: '8,921', total: '9,127.85' },
      { price: '1.0231', amount: '15,432', total: '15,788.45' },
      { price: '1.0230', amount: '6,789', total: '6,945.17' },
    ],
    asks: [
      { price: '1.0235', amount: '4,123', total: '4,219.84' },
      { price: '1.0236', amount: '9,876', total: '10,109.09' },
      { price: '1.0237', amount: '7,654', total: '7,835.46' },
      { price: '1.0238', amount: '11,234', total: '11,501.29' },
      { price: '1.0239', amount: '5,432', total: '5,561.82' },
    ],
  };

  const recentTrades = [
    { price: '1.0234', amount: '234.56', time: '14:23:45', type: 'buy' },
    { price: '1.0235', amount: '1,234.00', time: '14:23:42', type: 'sell' },
    { price: '1.0233', amount: '567.89', time: '14:23:38', type: 'buy' },
    { price: '1.0234', amount: '890.12', time: '14:23:35', type: 'buy' },
    { price: '1.0236', amount: '456.78', time: '14:23:30', type: 'sell' },
  ];

  const handlePlaceOrder = () => {
    if (!amount || !price) {
      toast.error('Please enter amount and price');
      return;
    }
    toast.success(`${orderType === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
    setAmount('');
    setPrice('');
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
          <h3 className="text-lg text-slate-100 mb-4">Order Book</h3>
          
          <div className="space-y-4">
            {/* Asks (Sell Orders) */}
            <div>
              <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-slate-500">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
              </div>
              <div className="space-y-1">
                {orderBook.asks.reverse().map((order, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-red-400">{order.price}</span>
                    <span className="text-slate-300 text-right">{order.amount}</span>
                    <span className="text-slate-400 text-right text-xs">{order.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spread */}
            <div className="py-2 text-center border-y border-slate-800">
              <span className="text-lg text-teal-400">1.0234</span>
              <span className="text-xs text-slate-500 ml-2">Spread: 0.0001</span>
            </div>

            {/* Bids (Buy Orders) */}
            <div>
              <div className="space-y-1">
                {orderBook.bids.map((order, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-teal-400">{order.price}</span>
                    <span className="text-slate-300 text-right">{order.amount}</span>
                    <span className="text-slate-400 text-right text-xs">{order.total}</span>
                  </div>
                ))}
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
                <Label>Price (RLUSD)</Label>
                <Input
                  type="number"
                  placeholder="1.0234"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Amount (EURC)</Label>
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
                    {amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '0.00'} RLUSD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fee (0.1%)</span>
                  <span className="text-slate-100">
                    {amount && price ? ((parseFloat(amount) * parseFloat(price)) * 0.001).toFixed(4) : '0.00'} RLUSD
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
              >
                Place Buy Order
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-2">
                <Label>Price (RLUSD)</Label>
                <Input
                  type="number"
                  placeholder="1.0234"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Amount (EURC)</Label>
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
                    {amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '0.00'} RLUSD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fee (0.1%)</span>
                  <span className="text-slate-100">
                    {amount && price ? ((parseFloat(amount) * parseFloat(price)) * 0.001).toFixed(4) : '0.00'} RLUSD
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              >
                Place Sell Order
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
