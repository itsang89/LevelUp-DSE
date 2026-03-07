import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCheckingSession(false);
      setError("Supabase is not configured.");
      return;
    }

    const supabase = getSupabaseClient();

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsReady(true);
      } else {
        const hash = window.location.hash;
        if (hash && hash.includes("type=recovery")) {
          await new Promise((r) => setTimeout(r, 500));
          const { data: retry } = await supabase.auth.getSession();
          if (retry.session) {
            setIsReady(true);
          } else {
            setError("Invalid or expired reset link. Please request a new one.");
          }
        } else {
          navigate("/login", { replace: true });
        }
      }
      setCheckingSession(false);
    }

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isSupabaseConfigured) return;

    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate("/planner", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isReady && error && !error.includes("Password")) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
        <Card variant="zen" padding="lg" className="max-w-md text-center space-y-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans">
      <div className="w-full max-w-[440px] px-6 z-10">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground mb-4 zen-shadow">
            <span className="material-symbols-outlined text-3xl font-light">lock_reset</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-primary font-display">
            Set New Password
          </h1>
          <p className="text-muted-foreground text-sm font-light max-w-[280px] mx-auto">
            Enter your new access key below.
          </p>
        </div>

        <Card variant="zen" padding="lg" className="backdrop-blur-sm bg-surface/80 border border-border-hairline">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">
                New Access Key
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background/50 focus:bg-surface transition-colors duration-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">
                Confirm Access Key
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background/50 focus:bg-surface transition-colors duration-300"
              />
            </div>

            {error && <p className="text-xs text-dot-red font-bold text-center">{error}</p>}

            <Button
              type="submit"
              className="w-full h-14 text-xs tracking-[0.2em]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
