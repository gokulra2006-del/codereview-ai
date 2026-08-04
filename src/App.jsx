import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CodeEditor from "./components/CodeEditor";
import DesignerPage from "./pages/DesignerPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Editor is publicly accessible — auth logic handled inside component */}
          <Route path="/editor" element={<CodeEditor />} />
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Designer portfolio page */}
          <Route path="/designer" element={<DesignerPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;