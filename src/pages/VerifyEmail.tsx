import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail } = useAuth();
  const email = (location.state as { email?: string })?.email || '';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setIsLoading(true);
    setError('');
    const result = await verifyEmail(email, code);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/chat');
    }
  };

  return (
    <AuthLayout title="Verify your email" subtitle={email ? `We sent a code to ${email}` : 'Enter the verification code sent to your email'}>
      <div className="flex flex-col items-center space-y-6">
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-12 w-12 border-border bg-discord-input-bg text-foreground" />
            <InputOTPSlot index={1} className="h-12 w-12 border-border bg-discord-input-bg text-foreground" />
            <InputOTPSlot index={2} className="h-12 w-12 border-border bg-discord-input-bg text-foreground" />
            <InputOTPSlot index={3} className="h-12 w-12 border-border bg-discord-input-bg text-foreground" />
            <InputOTPSlot index={4} className="h-12 w-12 border-border bg-discord-input-bg text-foreground" />
            <InputOTPSlot index={5} className="h-12 w-12 border-border bg-discord-input-bg text-foreground" />
          </InputOTPGroup>
        </InputOTP>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={code.length !== 6 || isLoading}
          className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-discord-blurple-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Verify Email
        </button>

        <p className="text-xs text-muted-foreground">
          Didn't receive a code?{' '}
          <button className="font-medium text-primary hover:underline">Resend</button>
        </p>
      </div>
    </AuthLayout>
  );
}
