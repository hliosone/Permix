import { useState, useEffect } from 'react';
import { QrCode, Shield, CheckCircle, Smartphone, ArrowLeft, Zap } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface VerificationFlowProps {
  domain: {
    id: string;
    name: string;
    policy: string;
  };
  onComplete: () => void;
  onBack: () => void;
}

export function VerificationFlow({ domain, onComplete, onBack }: VerificationFlowProps) {
  const [step, setStep] = useState<'request' | 'scan' | 'verify' | 'complete'>('request');
  const [qrCode, setQrCode] = useState('');

  const requiredAttributes = [
    { name: 'Age', requirement: '≥ 18', status: 'pending' },
    { name: 'Country', requirement: 'EU Member State', status: 'pending' },
    { name: 'KYC Level', requirement: 'Level 2', status: 'pending' },
  ];

  const [attributes, setAttributes] = useState(requiredAttributes);

  useEffect(() => {
    if (step === 'request') {
      // Simulate QR code generation
      setTimeout(() => {
        setQrCode('PERMIX-OID4VP-' + Math.random().toString(36).substring(7).toUpperCase());
        setStep('scan');
      }, 1000);
    }
  }, [step]);

  const handleScan = () => {
    setStep('verify');
    
    // Simulate verification process
    setTimeout(() => {
      setAttributes((attrs) =>
        attrs.map((attr, i) =>
          i === 0 ? { ...attr, status: 'verified' } : attr
        )
      );
    }, 1000);

    setTimeout(() => {
      setAttributes((attrs) =>
        attrs.map((attr, i) =>
          i === 1 ? { ...attr, status: 'verified' } : attr
        )
      );
    }, 2000);

    setTimeout(() => {
      setAttributes((attrs) =>
        attrs.map((attr, i) =>
          i === 2 ? { ...attr, status: 'verified' } : attr
        )
      );
      setStep('complete');
      toast.success('Identity verified successfully!');
    }, 3000);
  };

  const handleAcceptCredential = () => {
    onComplete();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl text-slate-100 mb-1">Identity Verification</h2>
          <p className="text-slate-400">
            Verifying access to <span className="text-teal-400">{domain.name}</span>
          </p>
        </div>
      </div>

      {/* Domain Info */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-teal-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg text-slate-100 mb-2">Policy: {domain.policy}</h3>
            <p className="text-sm text-slate-400 mb-4">
              The following attributes will be requested from your EUDI wallet:
            </p>
            <div className="space-y-2">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300">{attr.name}</span>
                    <code className="text-xs text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                      {attr.requirement}
                    </code>
                  </div>
                  {attr.status === 'verified' && (
                    <CheckCircle className="w-5 h-5 text-teal-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Verification Steps */}
      {step === 'request' && (
        <Card className="bg-slate-900/50 border-slate-800 p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <QrCode className="w-8 h-8 text-teal-400" />
            </div>
            <p className="text-slate-300">Generating verification request...</p>
          </div>
        </Card>
      )}

      {step === 'scan' && (
        <Card className="bg-slate-900/50 border-slate-800 p-8">
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-xl text-slate-100 mb-2">Scan QR Code</h3>
              <p className="text-slate-400">
                Use your EUDI wallet app to scan and share credentials
              </p>
            </div>

            {/* QR Code Display */}
            <div className="inline-block p-8 bg-white rounded-2xl">
              <div className="w-64 h-64 bg-slate-950 rounded-lg flex items-center justify-center">
                <QrCode className="w-32 h-32 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <code className="block text-xs text-slate-500 font-mono">{qrCode}</code>
              
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Smartphone className="w-4 h-4" />
                <span>Waiting for wallet response...</span>
              </div>

              <Button
                onClick={handleScan}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                Simulate Scan (Demo)
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 'verify' && (
        <Card className="bg-slate-900/50 border-slate-800 p-12">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Shield className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <h3 className="text-xl text-slate-100 mb-2">Verifying Credentials</h3>
              <p className="text-slate-400">Checking attributes against policy requirements...</p>
            </div>

            {/* Attribute Verification Progress */}
            <div className="max-w-md mx-auto space-y-2">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <span className="text-slate-300">{attr.name}</span>
                  {attr.status === 'verified' ? (
                    <CheckCircle className="w-5 h-5 text-teal-400" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {step === 'complete' && (
        <Card className="bg-gradient-to-br from-teal-500/20 to-transparent border-teal-500/50 p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-teal-500/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-teal-400" />
            </div>
            <div>
              <h3 className="text-2xl text-slate-100 mb-2">Verification Complete!</h3>
              <p className="text-slate-300 mb-4">
                All requirements met. You're ready to receive your domain credential.
              </p>
            </div>

            {/* Credential Preview */}
            <Card className="bg-slate-900/50 border-slate-800 p-6 max-w-md mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Badge className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-slate-100 mb-1">MemberOfDomain</h4>
                  <p className="text-sm text-slate-400 mb-2">{domain.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Issuer: {domain.id}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleAcceptCredential}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Accept Credential & Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-amber-500/5 border-amber-500/20 p-4">
        <p className="text-sm text-slate-300">
          🔒 <strong>Privacy:</strong> Only the required attributes are shared. Your EUDI wallet
          provides cryptographic proof without revealing unnecessary personal data.
        </p>
      </Card>
    </div>
  );
}
