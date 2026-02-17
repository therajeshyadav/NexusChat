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
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithGithub } = useAuth();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const result = await login(data.email, data.password);
    if (result.error) {
      setServerError(result.error);
    } else {
      navigate('/chat');
    }
  };

  return (
    <AuthLayout title="Welcome back!" subtitle="We're so excited to see you again!">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full rounded-md border-none bg-discord-input-bg px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground focus:ring-primary"
            placeholder="Enter your email"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            className="w-full rounded-md border-none bg-discord-input-bg px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-transparent transition-all placeholder:text-muted-foreground focus:ring-primary"
            placeholder="Enter your password"
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          <Link to="/forgot-password" className="mt-1 block text-xs font-medium text-primary hover:underline">
            Forgot your password?
          </Link>
        </div>

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-discord-blurple-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Log In
        </button>

        <p className="text-sm text-muted-foreground">
          Need an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">Register</Link>
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
