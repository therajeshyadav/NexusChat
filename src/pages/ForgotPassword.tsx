import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';

const schema = z.object({ email: z.string().trim().email('Invalid email address') });
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [success, setSuccess] = useState('');
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setSuccess('');
    const result = await forgotPassword(data.email);
    if (result.error) {
      setServerError(result.error);
    } else {
      setSuccess(result.message || 'Reset link sent!');
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Email</label>
          <input {...register('email')} type="email" className="w-full rounded-md border-none bg-discord-input-bg px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground focus:ring-primary" placeholder="Enter your email" />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {serverError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}
        {success && <p className="rounded-md bg-discord-green/10 px-3 py-2 text-sm text-discord-green">{success}</p>}

        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-discord-blurple-hover disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Send Reset Link
        </button>

        <Link to="/login" className="mt-2 block text-center text-sm font-medium text-primary hover:underline">
          Back to Login
        </Link>
      </form>
    </AuthLayout>
  );
}
