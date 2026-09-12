import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useGoogleAuth, ApiError } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import GoogleSignInButton from "@/components/google-signin-button";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const login = useLogin({
    mutation: {
      onSuccess: (data) => {
        setLocation(data.role === "admin" ? "/admin" : "/");
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 403 && (err.body as any)?.needsVerification) {
          const email = (err.body as any).email as string | undefined;
          toast({ title: "Email not verified", description: err.message });
          setLocation(email ? `/verify-code?email=${encodeURIComponent(email)}` : "/verify-code");
          return;
        }
        const isAuthError = err instanceof ApiError && err.status === 401;
        toast({
          title: isAuthError ? "Invalid credentials" : "Sign in failed",
          description: isAuthError
            ? "Please check your username and password."
            : `${err.message || "Something went wrong"} — this may be a server or database connectivity issue, not your credentials.`,
          variant: "destructive",
        });
      },
    },
  });

  const googleAuth = useGoogleAuth({
    mutation: {
      onSuccess: (data) => {
        setLocation(data.role === "admin" ? "/admin" : "/");
      },
      onError: (err) => {
        toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ data: { username: username.trim(), password } });
  }

  function handleBack() {
    window.history.back();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative bg-background">
      <button
        type="button"
        data-testid="button-back"
        onClick={handleBack}
        aria-label="Go back"
        className="absolute top-6 left-6 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={22} />
      </button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-px h-8 bg-primary opacity-60" />
            <span className="font-serif text-primary text-xs tracking-[0.4em] uppercase">Gold Hub</span>
            <div className="w-px h-8 bg-primary opacity-60" />
          </div>
          <h1 className="font-serif text-4xl text-foreground font-light mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm tracking-wider">Sign in to your account</p>
        </div>

        <div className="mb-6">
          <GoogleSignInButton onToken={(idToken) => googleAuth.mutate({ data: { idToken } })} />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground tracking-widest uppercase">Or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
              Username
            </label>
            <input
              data-testid="input-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-card border border-border px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <input
                data-testid="input-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 pr-11 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                data-testid="button-toggle-password"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            data-testid="button-login"
            type="submit"
            disabled={login.isPending}
            className="w-full bg-primary text-primary-foreground py-3 text-sm tracking-widest uppercase font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {login.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <div className="gold-divider mb-6" />
          <p className="text-xs text-muted-foreground tracking-wider mb-4">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Register
            </a>
          </p>
          <a href="/" className="text-xs text-muted-foreground tracking-wider hover:text-primary transition-colors uppercase">
            Return to Store
          </a>
        </div>
      </div>
    </div>
  );
}