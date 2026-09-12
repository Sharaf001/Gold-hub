import { useState } from "react";
import { useLocation } from "wouter";
import { useRegister, useGoogleAuth } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import GoogleSignInButton from "@/components/google-signin-button";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<"user" | "admin">("user");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const register = useRegister({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Almost there",
          description: "We've sent a 6-digit verification code to your email.",
        });
        setLocation(`/verify-code?email=${encodeURIComponent(data.email)}`);
      },
      onError: (err) => {
        toast({
          title: "Couldn't create account",
          description: err.message || "Please try a different username or email.",
          variant: "destructive",
        });
      },
    },
  });

  const googleAuth = useGoogleAuth({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Signed in with Google", description: "Welcome to Gold Hub." });
        setLocation(data.role === "admin" ? "/admin" : "/");
      },
      onError: (err) => {
        toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    register.mutate({
      data: {
        username: username.trim(),
        email: email.trim(),
        password,
        role: accountType,
        ...(accountType === "admin" ? { adminCode } : {}),
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-px h-8 bg-primary opacity-60" />
            <span className="font-serif text-primary text-xs tracking-[0.4em] uppercase">Gold Hub</span>
            <div className="w-px h-8 bg-primary opacity-60" />
          </div>
          <h1 className="font-serif text-4xl text-foreground font-light mb-2">Create Account</h1>
          <p className="text-muted-foreground text-sm tracking-wider">Join Gold Hub</p>
        </div>

        <div className="mb-6">
          <GoogleSignInButton onToken={(idToken) => googleAuth.mutate({ data: { idToken } })} />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground tracking-widest uppercase">Or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Account type toggle */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            data-testid="button-role-user"
            onClick={() => setAccountType("user")}
            className={`py-2.5 text-xs tracking-widest uppercase border transition-colors ${
              accountType === "user"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            Normal User
          </button>
          <button
            type="button"
            data-testid="button-role-admin"
            onClick={() => setAccountType("admin")}
            className={`py-2.5 text-xs tracking-widest uppercase border transition-colors ${
              accountType === "admin"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            Admin
          </button>
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
              placeholder="Choose a username"
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
              Email
            </label>
            <input
              data-testid="input-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-card border border-border px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="you@example.com"
              required
              autoComplete="email"
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
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
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
          <div>
            <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
              Confirm Password
            </label>
            <input
              data-testid="input-confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-card border border-border px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Re-enter your password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {accountType === "admin" && (
            <div>
              <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
                Admin Code
              </label>
              <input
                data-testid="input-admin-code"
                type="password"
                value={adminCode}
                onChange={e => setAdminCode(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Required to create an admin account"
                required
              />
            </div>
          )}

          <button
            data-testid="button-register"
            type="submit"
            disabled={register.isPending}
            className="w-full bg-primary text-primary-foreground py-3 text-sm tracking-widest uppercase font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {register.isPending ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <div className="gold-divider mb-6" />
          <p className="text-xs text-muted-foreground tracking-wider mb-4">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign In
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