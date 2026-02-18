import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = getSupabaseClient();

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          throw signUpError;
        }
        setNotice("Account created. If email confirmation is enabled, check your inbox.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw signInError;
        }
        navigate("/planner");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans selection:bg-gray-100">
      {/* Decorative Zen Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-dot-blue/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-dot-purple/5 rounded-full blur-[100px] animate-pulse delay-700" />
      <div className="absolute top-[20%] right-[10%] w-12 h-12 bg-dot-yellow/10 rounded-full blur-xl animate-bounce duration-[3s]" />
      <div className="absolute bottom-[20%] left-[10%] w-8 h-8 bg-dot-red/10 rounded-full blur-lg animate-bounce duration-[4s] delay-500" />

      <div className="w-full max-w-[440px] px-6 z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary text-white mb-4 zen-shadow animate-in zoom-in duration-700 delay-300">
            <span className="material-symbols-outlined text-3xl font-light">
              circle_notifications
            </span>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-primary font-display">
            LevelUp <span className="font-black">DSE</span>
          </h1>
          <p className="text-muted-foreground text-sm font-light tracking-wide max-w-[280px] mx-auto opacity-70">
            Your personal master-tracker for DSE preparation and daily goals.
          </p>
        </div>

        <Card variant="zen" padding="lg" className="space-y-8 backdrop-blur-sm bg-surface/80 border border-white/40">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-1">
                Academic ID
              </label>
              <Input
                type="email"
                placeholder="student@levelup.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 focus:bg-white transition-colors duration-300"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                  Access Key
                </label>
                <button
                  type="button"
                  className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100"
                >
                  Forgot Key?
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 focus:bg-white transition-colors duration-300"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-14 text-xs tracking-[0.2em]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isSignUp ? "Creating Account" : "Authenticating"}
                  </div>
                ) : (
                  isSignUp ? "Create Account" : "Begin Journey"
                )}
              </Button>
            </div>

            {error && (
              <p className="text-xs text-dot-red font-bold text-center">{error}</p>
            )}
            {notice && (
              <p className="text-xs text-dot-green font-bold text-center">{notice}</p>
            )}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-hairline opacity-50"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-transparent text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
                New to LevelUp?
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 text-[10px] tracking-[0.15em] border-dashed"
            type="button"
            onClick={() => {
              setError(null);
              setNotice(null);
              setIsSignUp((prev) => !prev);
            }}
          >
            {isSignUp ? "Back To Sign In" : "Create Free Account"}
          </Button>
        </Card>

        <p className="mt-10 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-30">
          DSE Study Companion &copy; 2026
        </p>
      </div>
    </div>
  );
}
