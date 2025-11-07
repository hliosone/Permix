import { useState, useEffect, useRef } from 'react';
import { QrCode, Shield, CheckCircle, Smartphone, ArrowLeft, Zap } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

// Helper UMD qui expose window.PermiXVerifier
import '../../backend/permiX-verifier-client.js';

interface VerificationFlowProps {
    domain: {
        id: string;
        name: string;
        policy: string;
    };
    onComplete: () => void;
    onBack: () => void;
}

type AttrStatus = 'pending' | 'verified';

// Charge la lib QRCode (qrcodejs) dynamiquement, seulement sur cette page
function loadQrCodeLib(): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).QRCode) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-permix-qrcode]');
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error('Failed to load QRCode lib')), { once: true });
            // si déjà chargée, resolve direct
            if ((window as any).QRCode) resolve();
            return;
        }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        s.async = true;
        s.defer = true;
        s.dataset.permixQrcode = '1';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load QRCode lib'));
        document.head.appendChild(s);
    });
}

export function VerificationFlow({ domain, onComplete, onBack }: VerificationFlowProps) {
    const [step, setStep] = useState<'request' | 'scan' | 'verify' | 'complete'>('request');
    const [qrCodeText, setQrCodeText] = useState('');
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    const requiredAttributes = [
        { name: 'Age', requirement: '≥ 18', status: 'pending' as AttrStatus },
        { name: 'Country', requirement: 'EU Member State', status: 'pending' as AttrStatus },
        { name: 'KYC Level', requirement: 'Level 2', status: 'pending' as AttrStatus },
    ];
    const [attributes, setAttributes] = useState(requiredAttributes);

    const PermiX: any = (window as any).PermiXVerifier;

    // 1) Crée la vérification et lance le polling
    useEffect(() => {
        if (step !== 'request') return;
        let cancelled = false;

        (async () => {
            try {
                if (!PermiX) throw new Error('PermiXVerifier helper not found');

                // Demande toujours ces 4 attributs
                const attrs = { familyName: true, givenName: true, ageOver18: true, nationalities: true };

                // Crée la demande de vérification
                const { id, verification_url } = await PermiX.createVerification(attrs);
                if (cancelled) return;

                setVerificationId(id);
                setQrCodeText(verification_url);
                setStep('scan'); // on affiche le QR

                // Démarre le polling immédiatement
                setStep('verify');
                const final = await PermiX.pollVerification(id, {
                    intervalMs: 2000,
                    maxTimeMs: 5 * 60 * 1000,
                });
                if (cancelled) return;

                if (final.state === 'SUCCESS') {
                    setAttributes(prev => prev.map(x => ({ ...x, status: 'verified' as AttrStatus })));
                    setStep('complete');
                    toast.success('Identity verified successfully!');
                } else {
                    setStep('scan');
                    toast.error(`Verification ${final.state?.toLowerCase() || 'failed'}`);
                }
            } catch (e: any) {
                if (!cancelled) {
                    console.error(e);
                    toast.error(e?.message || 'Verification error');
                    setStep('scan');
                }
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // 2) Rendre le QR dès que le DOM + la lib QR + l'URL sont prêts
    useEffect(() => {
        let disposed = false;

        (async () => {
            const shouldRender =
                (step === 'scan' || step === 'verify') &&
                qrCodeText &&
                qrRef.current;

            if (!shouldRender) return;

            try {
                await loadQrCodeLib(); // charge la lib ici, uniquement pour cette page
                if (disposed) return;

                if (!(window as any).QRCode) throw new Error('QRCode global is missing after load');
                if (!PermiX) throw new Error('PermiXVerifier helper not found');

                qrRef.current!.innerHTML = '';
                PermiX.renderQrCode(qrRef.current!, qrCodeText, { width: 256, height: 256 });
            } catch (err) {
                console.error('QR render error:', err);
                toast.error('Unable to render QR code');
            }
        })();

        return () => { disposed = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, qrCodeText]);

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

            {/* Request */}
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

            {/* Scan / Verify view (QR réel) */}
            {(step === 'scan' || step === 'verify') && (
                <Card className="bg-slate-900/50 border-slate-800 p-8">
                    <div className="text-center space-y-6">
                        <div>
                            <h3 className="text-xl text-slate-100 mb-2">
                                {step === 'scan' ? 'Scan QR Code' : 'Waiting for Wallet'}
                            </h3>
                            <p className="text-slate-400">
                                Use your EUDI wallet app to scan and share credentials
                            </p>
                        </div>

                        {/* QR réel */}
                        <div className="inline-block p-8 bg-white rounded-2xl">
                            <div className="w-64 h-64 rounded-lg flex items-center justify-center">
                                <div ref={qrRef} className="w-64 h-64" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {qrCodeText && (
                                <code className="block text-xs text-slate-500 font-mono break-all">
                                    {qrCodeText}
                                </code>
                            )}
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                                <Smartphone className="w-4 h-4" />
                                <span>Waiting for wallet response...</span>
                            </div>
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
