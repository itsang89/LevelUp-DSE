import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Layout } from "./components/Layout";
import { DEFAULT_SUBJECTS } from "./constants";
import { PastPapersPage } from "./pages/PastPapersPage";
import { PlannerPage } from "./pages/PlannerPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import type { CutoffData } from "./types";
import { loadCutoffData } from "./utils/dseLevelEstimator";
import { getSupabaseClient, isSupabaseConfigured } from "./lib/supabase";
import { listSubjects, seedDefaultSubjects } from "./lib/api/subjectsApi";
import type { Subject } from "./types";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [subjectsLoading, setSubjectsLoading] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [appError, setAppError] = useState<string | null>(null);
  const [cutoffData, setCutoffData] = useState<CutoffData>({});
  const [usingGenericFallback, setUsingGenericFallback] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    loadCutoffData().then((result) => {
      if (!isMounted) {
        return;
      }
      setCutoffData(result.cutoffData);
      setUsingGenericFallback(result.usingGenericFallback);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      setAppError(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
      );
      return;
    }

    const supabase = getSupabaseClient();

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setAppError(error.message);
        }
        setSession(data.session ?? null);
      })
      .finally(() => {
        setAuthLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAppError(null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setSubjects([]);
      setSubjectsLoading(false);
      return;
    }

    const userId = session.user.id;
    let isMounted = true;

    async function loadSubjects(): Promise<void> {
      setSubjectsLoading(true);
      try {
        const currentSubjects = await listSubjects(userId);
        if (currentSubjects.length === 0) {
          await seedDefaultSubjects(userId, DEFAULT_SUBJECTS);
          if (isMounted) {
            setSubjects(DEFAULT_SUBJECTS);
          }
        } else if (isMounted) {
          setSubjects(currentSubjects);
        }
      } catch (error) {
        if (isMounted) {
          setAppError(error instanceof Error ? error.message : "Failed to load subjects.");
        }
      } finally {
        if (isMounted) {
          setSubjectsLoading(false);
        }
      }
    }

    loadSubjects();

    return () => {
      isMounted = false;
    };
  }, [session]);

  if (authLoading || (session && subjectsLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-xl space-y-3">
          <h1 className="text-2xl font-bold text-primary">Supabase setup required</h1>
          <p className="text-sm text-muted-foreground">
            Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your `.env` file.
          </p>
        </div>
      </div>
    );
  }

  if (appError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-xl space-y-4">
          <h1 className="text-2xl font-bold text-primary">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">{appError}</p>
        </div>
      </div>
    );
  }

  const userId = session?.user.id;

  return (
    <Routes>
      <Route
        path="/"
        element={session ? <Navigate to="/planner" replace /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/login"
        element={session ? <Navigate to="/planner" replace /> : <LoginPage />}
      />
      <Route element={session ? <Layout /> : <Navigate to="/login" replace />}>
        <Route
          path="/planner"
          element={
            userId ? (
              <PlannerPage subjects={subjects} userId={userId} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/past-papers"
          element={
            userId ? (
              <PastPapersPage
                userId={userId}
                subjects={subjects}
                cutoffData={cutoffData}
                usingGenericFallback={usingGenericFallback}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            userId ? (
              <SettingsPage
                userId={userId}
                subjects={subjects}
                setSubjects={setSubjects}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Route>
      <Route
        path="*"
        element={session ? <Navigate to="/planner" replace /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
