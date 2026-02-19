import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import OAuthButton from '@/components/auth/OAuthButton';

const schema = z.object({
  email: z.string().trim().email('Invalid email address'),
  username: z.string().trim().min(2, 'Username must be at least 2 characters').max(32, 'Username must be under 32 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, loginWithGithub } = useAuth();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const result = await signup(data.username, data.email, data.password);
    if (result.error) {
      setServerError(result.error);
    } else {
      navigate('/verify-email', { state: { email: data.email } });
    }
  };

  return (
    <AuthLayout title="Create an account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Email</label>
          <input {...register('email')} type="email" className="w-full rounded-md border-none bg-discord-input-bg px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground focus:ring-primary" placeholder="Enter your email" />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Username</label>
          <input {...register('username')} className="w-full rounded-md border-none bg-discord-input-bg px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground focus:ring-primary" placeholder="Choose a username" />
          {errors.username && <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Password</label>
          <input {...register('password')} type="password" className="w-full rounded-md border-none bg-discord-input-bg px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground focus:ring-primary" placeholder="Create a password" />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Confirm Password</label>
          <input {...register('confirmPassword')} type="password" className="w-full rounded-md border-none bg-discord-input-bg px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground focus:ring-primary" placeholder="Confirm your password" />
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
        )}

        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-discord-blurple-hover disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue
        </button>

        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Log In</Link>
        </p>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-discord-dark px-2 text-muted-foreground">OR</span></div>
        </div>

        <div className="space-y-2">
          <OAuthButton provider="google" onClick={loginWithGoogle} disabled={isSubmitting} />
          <OAuthButton provider="github" onClick={loginWithGithub} disabled={isSubmitting} />
        </div>
      </form>
    </AuthLayout>
  );
}
