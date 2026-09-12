import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin, useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me, isLoading: checkingAuth } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  useEffect(() => {
    if (me) setLocation('/admin');
  }, [me, setLocation]);

  const login = useLogin({
    mutation: {
      onSuccess: (user) => {
        queryClient.setQueryData(getGetMeQueryKey(), user);
        toast({ title: 'Welcome back', description: `Signed in as ${user.username}` });
        setLocation('/admin');
      },
      onError: () => {
        toast({
          title: 'Access Denied',
          description: 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
      },
    },
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = (data: LoginForm) => {
    login.mutate({ data });
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[100dvh] bg-[hsl(24_8%_7%)] flex items-center justify-center">
        <div className="font-serif text-2xl tracking-[0.4em] text-[hsl(43_56%_60%)] animate-pulse">AURUM</div>
      </div>
    );
  }

  return (
    <div className="grain-overlay min-h-[100dvh] bg-[hsl(24_8%_7%)] flex overflow-hidden">
      {/* Left — decorative panel */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16"
        style={{
          background: 'hsl(24 8% 9%)',
          borderRight: '1px solid rgba(201, 168, 76, 0.12)',
        }}
      >
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(/hero-jewelry.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(24 8% 9% / 0.8) 0%, hsl(24 8% 7% / 0.95) 100%)',
          }}
        />

        {/* Corner ornaments */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-[rgba(201,168,76,0.2)]" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-[rgba(201,168,76,0.2)]" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-[rgba(201,168,76,0.2)]" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-[rgba(201,168,76,0.2)]" />

        {/* Content */}
        <div className="relative">
          <div className="font-serif text-3xl tracking-[0.5em] text-[hsl(43_56%_60%)] font-light leading-none">AURUM</div>
          <div className="text-[9px] tracking-[0.35em] uppercase text-[hsl(38_15%_40%)] mt-1.5">Fine Jewellery · Est. 1987</div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="font-serif text-5xl font-light text-[hsl(42_35%_85%)] leading-tight mb-6">
              The Private<br />
              Console
            </h2>
            <p className="text-[13px] text-[hsl(38_15%_50%)] leading-relaxed max-w-xs tracking-wide">
              Reserved for AURUM curatorial staff. Manage the collection, 
              receive client enquiries, and oversee the maison.
            </p>
          </div>

          <div className="divider-gold" />

          <div className="space-y-4">
            {[
              'Curate the living collection',
              'Receive private client enquiries',
              'Oversee order fulfilment',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-[hsl(43_56%_49%)] rotate-45 flex-shrink-0" />
                <span className="text-[12px] text-[hsl(38_15%_52%)] tracking-wide">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[11px] text-[hsl(38_15%_35%)] tracking-wide">
          © 2024 Maison Aurum
        </div>
      </motion.div>

      {/* Right — login form */}
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        className="flex-1 flex items-center justify-center px-6 py-16"
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="font-serif text-2xl tracking-[0.5em] text-[hsl(43_56%_60%)] font-light">AURUM</div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-[hsl(38_15%_40%)] mt-1">Fine Jewellery</div>
          </div>

          <div className="mb-10">
            <h1 className="font-serif text-3xl font-light text-[hsl(42_35%_88%)] mb-2">Private Access</h1>
            <p className="text-[12px] text-[hsl(38_15%_50%)] tracking-wide">
              Authorised personnel only.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-[9px] tracking-[0.25em] uppercase text-[hsl(38_15%_45%)] block mb-2">
                Username
              </label>
              <input
                {...form.register('username')}
                className="w-full bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.15)] px-4 py-3.5 text-[13px] text-[hsl(42_35%_82%)] placeholder:text-[hsl(38_15%_35%)] focus:outline-none focus:border-[rgba(201,168,76,0.45)] transition-colors"
                placeholder="Enter username"
                autoComplete="username"
                data-testid="input-username"
              />
              {form.formState.errors.username && (
                <p className="text-[10px] text-[hsl(0_55%_55%)] mt-1.5">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="text-[9px] tracking-[0.25em] uppercase text-[hsl(38_15%_45%)] block mb-2">
                Password
              </label>
              <input
                {...form.register('password')}
                type="password"
                className="w-full bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.15)] px-4 py-3.5 text-[13px] text-[hsl(42_35%_82%)] placeholder:text-[hsl(38_15%_35%)] focus:outline-none focus:border-[rgba(201,168,76,0.45)] transition-colors"
                placeholder="Enter password"
                autoComplete="current-password"
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-[10px] text-[hsl(0_55%_55%)] mt-1.5">{form.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="btn-gold w-full py-4 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              data-testid="button-login"
            >
              {login.isPending ? 'Authenticating...' : 'Enter Console'}
            </button>
          </form>

          <div className="mt-8 divider-gold" />

          <div className="mt-6 text-center">
            <span className="text-[11px] text-[hsl(38_15%_40%)] tracking-wide">
              Not staff?{' '}
            </span>
            <a href="/" className="text-[11px] text-[hsl(43_45%_55%)] hover:text-[hsl(43_56%_65%)] transition-colors tracking-wide">
              Return to Boutique
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
