import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider, useThemeContext } from "./context/ThemeContext";
import { HelpDialog } from "./components/HelpDialog";
import { CloseActionGuard } from "./components/CloseActionGuard";
import { Layout } from "./components/Layout";
import { Dashboard } from "./views/Dashboard";
import { CODING_WORKSPACE_CONFIG, PERSONAL_WORKSPACE_CONFIG } from "./views/workspaceConfigs";

// Route-level code splitting. Dashboard is the default landing route and stays
// eager; the heavier views are split into their own chunks. Views use named
// exports, so map them to `default` for React.lazy.
const MySkills = lazy(() => import("./views/MySkills").then((m) => ({ default: m.MySkills })));
const WorkspaceView = lazy(() =>
  import("./views/WorkspaceView").then((m) => ({ default: m.WorkspaceView }))
);
const InstallSkills = lazy(() =>
  import("./views/InstallSkills").then((m) => ({ default: m.InstallSkills }))
);
const Settings = lazy(() => import("./views/Settings").then((m) => ({ default: m.Settings })));
const ProjectDetail = lazy(() =>
  import("./views/ProjectDetail").then((m) => ({ default: m.ProjectDetail }))
);

function LobsterRedirect() {
  const { agentKey } = useParams();
  return <Navigate to={agentKey ? `/personal-workspace/${agentKey}` : "/personal-workspace"} replace />;
}

function ThemedToaster() {
  const { resolvedTheme } = useThemeContext();
  return (
    <Toaster
      theme={resolvedTheme}
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
        },
      }}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="h-full w-full" />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/my-skills" element={<MySkills />} />
                <Route path="/global-workspace" element={<WorkspaceView config={CODING_WORKSPACE_CONFIG} />} />
                <Route path="/global-workspace/:agentKey" element={<WorkspaceView config={CODING_WORKSPACE_CONFIG} />} />
                <Route path="/personal-workspace" element={<WorkspaceView config={PERSONAL_WORKSPACE_CONFIG} />} />
                <Route path="/personal-workspace/:agentKey" element={<WorkspaceView config={PERSONAL_WORKSPACE_CONFIG} />} />
                <Route path="/lobster-workspace" element={<Navigate to="/personal-workspace" replace />} />
                <Route path="/lobster-workspace/:agentKey" element={<LobsterRedirect />} />
                <Route path="/install" element={<InstallSkills />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </Suspense>
          <HelpDialog />
          <CloseActionGuard />
        </BrowserRouter>
        <ThemedToaster />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
