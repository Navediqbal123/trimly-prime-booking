import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="mb-4 text-5xl font-bold text-primary">404</h1>
        <p className="mb-4 text-xl font-semibold text-foreground">Oops! Page not found</p>
        <p className="mb-6 text-sm text-muted-foreground">
          The page you are looking for may have been moved or doesn't exist.
        </p>
        <Link to="/" className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
