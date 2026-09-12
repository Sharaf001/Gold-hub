import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <p className="text-primary font-serif text-6xl mb-4">404</p>
        <h1 className="font-serif text-3xl text-foreground font-light mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block border border-primary text-primary px-8 py-3 text-sm tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
