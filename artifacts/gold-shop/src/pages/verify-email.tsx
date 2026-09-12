import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { useVerifyEmail } from "@workspace/api-client-react";
import { Gem, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmail() {
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [attempted, setAttempted] = useState(false);

  const verify = useVerifyEmail();

  useEffect(() => {
    if (token && !attempted) {
      setAttempted(true);
      verify.mutate({ data: { token } });
    }
  }, [token, attempted, verify]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "radial-gradient(ellipse at center top, hsl(28 35% 7%) 0%, hsl(28 40% 3%) 70%)",
      }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-px h-8 bg-primary opacity-60" />
          <span className="font-serif text-primary text-xs tracking-[0.4em] uppercase">Gold Hub</span>
          <div className="w-px h-8 bg-primary opacity-60" />
        </div>

        {!token && (
          <>
            <XCircle size={40} className="mx-auto text-destructive mb-4" />
            <h1 className="font-serif text-2xl text-foreground font-light mb-2">Missing verification link</h1>
            <p className="text-muted-foreground text-sm">
              This page needs a verification token. Please use the link from your email.
            </p>
          </>
        )}

        {token && verify.isPending && (
          <>
            <Gem size={40} className="mx-auto text-primary opacity-40 mb-4 animate-pulse" />
            <p className="text-muted-foreground text-sm">Verifying your email...</p>
          </>
        )}

        {token && verify.isSuccess && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-green-400 mb-4" />
            <h1 className="font-serif text-2xl text-foreground font-light mb-2">Email verified</h1>
            <p className="text-muted-foreground text-sm mb-8">
              Your account is fully confirmed. You're good to go.
            </p>
          </>
        )}

        {token && verify.isError && (
          <>
            <XCircle size={40} className="mx-auto text-destructive mb-4" />
            <h1 className="font-serif text-2xl text-foreground font-light mb-2">Verification failed</h1>
            <p className="text-muted-foreground text-sm mb-8">
              {verify.error?.message || "This link is invalid or has expired."}
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
        >
          Continue to Store
        </Link>
      </div>
    </div>
  );
}