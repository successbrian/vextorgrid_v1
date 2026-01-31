import { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { UserPlus, Share2, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'qrcode';

export function ReferralEngine() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadReferralCode();
  }, [user]);

  const loadReferralCode = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vextor_profiles')
        .select('referral_code')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.referral_code) {
        setReferralCode(data.referral_code);
        generateQRCode(data.referral_code);
      }
    } catch (err) {
      console.error('Error loading referral code:', err);
    }
  };

  const generateQRCode = async (code: string) => {
    const referralUrl = `${window.location.origin}/join?ref=${code}`;

    try {
      const url = await QRCode.toDataURL(referralUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#008080',
          light: '#1a1a1a',
        },
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const handleCopy = async () => {
    const referralUrl = `${window.location.origin}/join?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    const referralUrl = `${window.location.origin}/join?ref=${referralCode}`;
    const shareData = {
      title: 'Join VectorGrid',
      text: 'Join me on VectorGrid - The Ultimate Fleet Command Platform',
      url: referralUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await handleCopy();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (!referralCode) {
    return null;
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
          <div className="w-10 h-10 bg-[#252525] border-2 border-[#008080] flex items-center justify-center">
            <UserPlus size={20} className="text-[#008080]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
              RECRUITMENT
            </h2>
            <p className="text-sm text-gray-400">Expand your network</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Your Referral Code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-[#252525] border-2 border-[#008080] text-white text-2xl font-bold text-center tracking-widest" style={{ fontFamily: 'monospace' }}>
                {referralCode}
              </div>
            </div>
          </div>

          {qrCodeUrl && (
            <div className="flex justify-center">
              <div className="p-3 bg-[#252525] border-2 border-[#008080]">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleCopy} className="flex-1">
              {copied ? <Check size={20} /> : <Copy size={20} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </Button>
            <Button onClick={handleShare} variant="secondary" className="flex-1">
              <Share2 size={20} />
              <span>Share</span>
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Share your code with new recruits. They'll use it when signing up.
          </div>
        </div>
      </div>
    </Card>
  );
}
