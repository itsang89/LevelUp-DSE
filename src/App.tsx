import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { PastPapersPage } from "./pages/PastPapersPage";
import { PlannerPage } from "./pages/PlannerPage";
import { PlanPage } from "./pages/PlanPage";
import { SubjectsPage } from "./pages/SubjectsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { LoginPage } from "./pages/LoginPage";
import { LandingPage } from "./pages/LandingPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ExamTimetablePage } from "./pages/ExamTimetablePage";
import { DataProvider, useData } from "./contexts/DataContext";

function RedirectToLogin() {
  const location = useLocation();
  return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function AppRoutes() {
  const {
    session,
    userId,
    isGuest,
    authLoading,
    subjectsLoading,
    subjects,
    setSubjects,
    cells,
    setCells,
    dataWarnings,
    dismissDataWarning,
    cutoffData,
    usingGenericFallback,
    appError,
  } = useData();
  const canUseApp = Boolean(session) || isGuest;

  useEffect(() => {
    const handleSubjectDeleted = (e: CustomEvent<{ subjectId: string }>) => {
      const { subjectId } = e.detail ?? {};
      if (subjectId) {
        setCells((prev) => prev.filter((c) => c.task?.subjectId !== subjectId));
      }
    };
    window.addEventListener("subject-deleted", handleSubjectDeleted as EventListener);
    return () => window.removeEventListener("subject-deleted", handleSubjectDeleted as EventListener);
  }, [setCells]);

  if (authLoading || (session && subjectsLoading)) {
    return <SkeletonLoader />;
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

  return (
    <Routes>
      <Route
        path="/"
        element={canUseApp ? <Navigate to="/planner" replace /> : <LandingPage />}
      />
      <Route
        path="/login"
        element={session ? <Navigate to="/planner" replace /> : <LoginPage />}
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          canUseApp ? (
            <Layout
              isGuest={isGuest}
              subjects={subjects}
              cells={cells}
              warnings={dataWarnings}
              onDismissWarning={dismissDataWarning}
            />
          ) : (
            <RedirectToLogin />
          )
        }
      >
        <Route
          path="/plan"
          element={
            userId ? (
              <PlanPage
                userId={userId}
                isGuest={isGuest}
                subjects={subjects}
                cells={cells}
                cutoffData={cutoffData}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/planner"
          element={
            userId ? (
              <PlannerPage
                subjects={subjects}
                userId={userId}
                isGuest={isGuest}
                cells={cells}
                setCells={setCells}
              />
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
                isGuest={isGuest}
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
          path="/analytics"
          element={
            userId ? (
              <AnalyticsPage
                userId={userId}
                isGuest={isGuest}
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
          path="/subjects"
          element={
            userId ? (
              <SubjectsPage
                userId={userId}
                isGuest={isGuest}
                subjects={subjects}
                setSubjects={setSubjects}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/exam-timetable"
          element={
            userId ? (
              <ExamTimetablePage subjects={subjects} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Route>
      <Route
        path="*"
        element={canUseApp ? <Navigate to="/planner" replace /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <DataProvider>
      <AppRoutes />
    </DataProvider>
  );
}

export default App;
