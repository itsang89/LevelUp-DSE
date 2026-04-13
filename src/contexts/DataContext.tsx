'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { CutoffData, PlannerCell, PastPaperAttempt, Subject } from "../types";
import { DEFAULT_SUBJECTS } from "../constants";
import { loadCutoffData } from "../utils/dseLevelEstimator";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import { listSubjects, seedDefaultSubjects } from "../lib/api/subjectsApi";
import { listPlannerCells, upsertPlannerCell } from "../lib/api/plannerApi";
import {
  createPastPaperAttempt,
  updatePastPaperAttempt,
} from "../lib/api/pastPapersApi";
import { type StudyGoal, upsertStudyGoal } from "../lib/api/goalsApi";
import {
  clearAllGuestData,
  getGuestPastPapers,
  getGuestPlannerCells,
  getGuestStudyGoals,
  getGuestSubjects,
  hasGuestData,
  isGuestMode,
  setGuestMode,
  setGuestPastPapers,
  setGuestPlannerCells,
  setGuestStudyGoals,
  setGuestSubjects,
} from "../lib/localStorageService";

interface DataContextValue {
  session: Session | null;
  userId: string | null;
  isGuest: boolean;
  authLoading: boolean;
  subjectsLoading: boolean;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  cells: PlannerCell[];
  setCells: React.Dispatch<React.SetStateAction<PlannerCell[]>>;
  cutoffData: CutoffData;
  usingGenericFallback: boolean;
  dataWarnings: string[];
  dismissDataWarning: (warning: string) => void;
  appError: string | null;
  startGuestMode: () => void;
  stopGuestMode: () => void;
  persistGuestPastPapers: (attempts: PastPaperAttempt[]) => void;
  persistGuestStudyGoals: (goals: StudyGoal[]) => void;
  getGuestPastPapersData: () => PastPaperAttempt[];
  getGuestStudyGoalsData: () => StudyGoal[];
  hasGuestStoredData: () => boolean;
  migrateGuestDataToAccount: (targetUserId: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [subjectsLoading, setSubjectsLoading] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cells, setCells] = useState<PlannerCell[]>([]);
  const [appError, setAppError] = useState<string | null>(null);
  const [dataWarnings, setDataWarnings] = useState<string[]>([]);
  const [cutoffData, setCutoffData] = useState<CutoffData>({});
  const [usingGenericFallback, setUsingGenericFallback] = useState<boolean>(false);
  const [guestEnabled, setGuestEnabled] = useState<boolean>(() => isGuestMode());
  const migrationInProgressRef = useRef(false);

  const isGuest = guestEnabled && !session;
  const userId = session?.user.id ?? (isGuest ? "guest" : null);

  const addDataWarning = useCallback((message: string): void => {
    setDataWarnings((prev) => (prev.includes(message) ? prev : [...prev, message]));
  }, []);

  const dismissDataWarning = useCallback((warning: string): void => {
    setDataWarnings((prev) => prev.filter((item) => item !== warning));
  }, []);

  const startGuestMode = useCallback(() => {
    setGuestMode(true);
    setGuestEnabled(true);
    setAppError(null);
  }, []);

  const stopGuestMode = useCallback(() => {
    setGuestMode(false);
    setGuestEnabled(false);
  }, []);

  const persistGuestPastPapers = useCallback((attempts: PastPaperAttempt[]) => {
    setGuestPastPapers(attempts);
  }, []);

  const persistGuestStudyGoals = useCallback((goals: StudyGoal[]) => {
    setGuestStudyGoals(goals);
  }, []);

  const getGuestPastPapersData = useCallback(() => getGuestPastPapers(), []);
  const getGuestStudyGoalsData = useCallback(() => getGuestStudyGoals(), []);
  const hasGuestStoredData = useCallback(() => hasGuestData(), []);

  useEffect(() => {
    let isMounted = true;
    loadCutoffData()
      .then((result) => {
        if (!isMounted) {
          return;
        }
        setCutoffData(result.cutoffData);
        setUsingGenericFallback(result.usingGenericFallback);
        if (result.usingGenericFallback) {
          addDataWarning("Cutoff data unavailable - level estimates may be less accurate.");
        }
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setUsingGenericFallback(true);
        addDataWarning("Cutoff data unavailable - level estimates may be less accurate.");
      });

    return () => {
      isMounted = false;
    };
  }, [addDataWarning]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setAppError(error.message);
          return;
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

  const migrateGuestDataToAccount = useCallback(async (targetUserId: string): Promise<void> => {
    if (migrationInProgressRef.current) return;
    migrationInProgressRef.current = true;

    const guestSubjects = getGuestSubjects();
    const guestCells = getGuestPlannerCells();
    const guestAttempts = getGuestPastPapers();
    const guestGoals = getGuestStudyGoals();

    if (guestSubjects.length > 0) {
      await seedDefaultSubjects(targetUserId, guestSubjects);
    }

    if (guestCells.length > 0) {
      await Promise.all(
        guestCells
          .filter((cell) => Boolean(cell.task))
          .map((cell) => upsertPlannerCell(targetUserId, cell.date, cell.sessionId, cell.task!))
      );
    }

    if (guestAttempts.length > 0) {
      await Promise.all(
        guestAttempts.map(async (attempt) => {
          try {
            await createPastPaperAttempt(targetUserId, attempt);
          } catch {
            await updatePastPaperAttempt(targetUserId, attempt);
          }
        })
      );
    }

    if (guestGoals.length > 0) {
      await Promise.all(
        guestGoals.map((goal) => upsertStudyGoal(targetUserId, goal.subjectId, goal.weeklyTarget))
      );
    }

    clearAllGuestData();
    setGuestEnabled(false);
    setSubjects(await listSubjects(targetUserId));
    setCells(await listPlannerCells(targetUserId));
    setDataWarnings([]);
    migrationInProgressRef.current = false;
  }, []);

  useEffect(() => {
    if (isGuest) {
      const guestSubjects = getGuestSubjects();
      if (guestSubjects.length === 0) {
        setSubjects(DEFAULT_SUBJECTS);
        setGuestSubjects(DEFAULT_SUBJECTS);
      } else {
        setSubjects(guestSubjects);
      }
      setCells(getGuestPlannerCells());
      setSubjectsLoading(false);
      return;
    }

    if (!session) {
      setSubjects([]);
      setCells([]);
      setSubjectsLoading(false);
      return;
    }

    const currentUserId = session.user.id;
    let isMounted = true;

    // Auto-migrate guest data when a session is established via email-confirmation
    // link (bypasses LoginPage's handlePostAuth). The ref guard prevents a second
    // migration if LoginPage already started one for immediate-session signups.
    if (hasGuestData()) {
      migrateGuestDataToAccount(currentUserId).catch((error) => {
        if (isMounted) {
          addDataWarning(
            error instanceof Error ? error.message : "Guest data migration failed."
          );
        }
      });
      return () => {
        isMounted = false;
      };
    }

    async function loadRemoteSubjects(): Promise<void> {
      setSubjectsLoading(true);
      try {
        const currentSubjects = await listSubjects(currentUserId);
        if (currentSubjects.length === 0) {
          await seedDefaultSubjects(currentUserId, DEFAULT_SUBJECTS);
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

    loadRemoteSubjects();
    listPlannerCells(currentUserId)
      .then((rows) => {
        if (isMounted) {
          setCells(rows);
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        const message = error instanceof Error ? error.message : "Failed to load planner sessions.";
        addDataWarning(`Planner sessions unavailable: ${message}`);
      });

    return () => {
      isMounted = false;
    };
  }, [session, isGuest, addDataWarning, migrateGuestDataToAccount]);

  useEffect(() => {
    if (isGuest) {
      setGuestSubjects(subjects);
    }
  }, [isGuest, subjects]);

  useEffect(() => {
    if (isGuest) {
      setGuestPlannerCells(cells);
    }
  }, [isGuest, cells]);

  const value = useMemo<DataContextValue>(
    () => ({
      session,
      userId,
      isGuest,
      authLoading,
      subjectsLoading,
      subjects,
      setSubjects,
      cells,
      setCells,
      cutoffData,
      usingGenericFallback,
      dataWarnings,
      dismissDataWarning,
      appError,
      startGuestMode,
      stopGuestMode,
      persistGuestPastPapers,
      persistGuestStudyGoals,
      getGuestPastPapersData,
      getGuestStudyGoalsData,
      hasGuestStoredData,
      migrateGuestDataToAccount,
    }),
    [
      appError,
      authLoading,
      cells,
      cutoffData,
      dataWarnings,
      dismissDataWarning,
      getGuestPastPapersData,
      getGuestStudyGoalsData,
      hasGuestStoredData,
      isGuest,
      migrateGuestDataToAccount,
      persistGuestPastPapers,
      persistGuestStudyGoals,
      session,
      startGuestMode,
      stopGuestMode,
      subjects,
      subjectsLoading,
      userId,
      usingGenericFallback,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider.");
  }
  return context;
}
