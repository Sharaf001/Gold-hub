import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useVerifyCode, useResendVerification } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Gem } from "lucide-react";

export default function VerifyCode() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const search = useSearch();
  const initialEmail = new URLSearchParams(search).get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");

  const verifyCode = useVerifyCode({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Email verified", description: "You're all set." });
        setLocation(data.role === "admin" ? "/admin" : "/");
      },
      onError: (err) => {
        toast({ title: "Verification failed", description: err.message, variant: "destructive" });
      },
    },
  });

  const resend = useResendVerification({
    mutation: {
      onSuccess: (data) => {
        toast({ title: data.message });
      },
      onError: (err) => {
        toast({ title: "Couldn't resend code", description: err.message, variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    verifyCode.mutate({ data: { email: email.trim().toLowerCase(), code: code.trim() } });
  }

  function handleResend() {
    if (!email.trim()) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    resend.mutate({ data: { email: email.trim().toLowerCase() } });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-px h-8 bg-primary opacity-60" />
            <span className="font-serif text-primary text-xs tracking-[0.4em] uppercase">Gold Hub</span>
            <div className="w-px h-8 bg-primary opacity-60" />
          </div>
          <Gem size={28} className="mx-auto text-primary opacity-50 mb-4" />
          <h1 className="font-serif text-3xl text-foreground font-light mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground text-sm">
            Enter the 6-digit code we sent to your email. It expires in 15 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              Verification Code
            </label>
            <input
              data-testid="input-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-card border border-border px-4 py-3 text-foreground text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-primary transition-colors"
              placeholder="000000"
              required
            />
          </div>

          <button
            data-testid="button-verify"
            type="submit"
            disabled={verifyCode.isPending || code.length !== 6}
            className="w-full bg-primary text-primary-foreground py-3 text-sm tracking-widest uppercase font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {verifyCode.isPending ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            data-testid="button-resend"
            onClick={handleResend}
            disabled={resend.isPending}
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline disabled:opacity-50"
          >
            {resend.isPending ? "Sending..." : "Didn't get a code? Resend"}
          </button>
        </div>

        <div className="mt-10 text-center">
          <div className="gold-divider mb-6" />
          <a href="/login" className="text-xs text-muted-foreground tracking-wider hover:text-primary transition-colors uppercase">
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}