import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { resetPassword } = useAuth();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const result = await resetPassword(token, data.password);
    if (result.error) {
      setServerError(result.error);
    } else {
      navigate('/login');
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">New Password</label>
          <input {...register('password')} type="password" className="w-full rounded-md border-none bg-discord-input-bg px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground focus:ring-primary" placeholder="Enter new password" />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Confirm Password</label>
          <input {...register('confirmPassword')} type="password" className="w-full rounded-md border-none bg-discord-input-bg px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground focus:ring-primary" placeholder="Confirm new password" />
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        {serverError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-discord-blurple-hover disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Reset Password
        </button>

        <Link to="/login" className="mt-2 block text-center text-sm font-medium text-primary hover:underline">Back to Login</Link>
      </form>
    </AuthLayout>
  );
}
