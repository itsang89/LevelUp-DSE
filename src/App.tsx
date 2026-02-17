import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DEFAULT_SUBJECTS, STORAGE_KEYS } from "./constants";
import { usePersistentState } from "./hooks/usePersistentState";
import { PastPapersPage } from "./pages/PastPapersPage";
import { PlannerPage } from "./pages/PlannerPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import type { CutoffData } from "./types";
import { loadCutoffData } from "./utils/dseLevelEstimator";

function App() {
  const [subjects, setSubjects] = usePersistentState(STORAGE_KEYS.subjects, DEFAULT_SUBJECTS);
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

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/planner" replace />} />
        <Route path="/planner" element={<PlannerPage subjects={subjects} />} />
        <Route
          path="/past-papers"
          element={
            <PastPapersPage
              subjects={subjects}
              cutoffData={cutoffData}
              usingGenericFallback={usingGenericFallback}
            />
          }
        />
        <Route
          path="/settings"
          element={<SettingsPage subjects={subjects} setSubjects={setSubjects} />}
        />
      </Route>
    </Routes>
  );
}

export default App;
