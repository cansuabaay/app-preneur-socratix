import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage          from "./pages/LoginPage";
import SignUpPage         from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage      from "./pages/DashboardPage";
import CreateIdeaPage     from "./pages/CreateIdeaPage";
import DevilsAdvocatePage from "./pages/DevilsAdvocatePage";
import IdeaDetailPage     from "./pages/IdeaDetailPage";
import EditIdeaPage       from "./pages/EditIdeaPage";
import MessagesPage       from "./pages/MessagesPage";
import ProfilePage        from "./pages/ProfilePage";
import ProtectedRoute     from "./pages/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public auth screens */}
      <Route path="/"       element={<Navigate to="/login" replace />} />
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />

      {/* Protected app screens */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"        element={<DashboardPage />} />
        <Route path="/create"           element={<CreateIdeaPage />} />
        <Route path="/devil/:ideaId"    element={<DevilsAdvocatePage />} />
        <Route path="/ideas/:ideaId/edit" element={<EditIdeaPage />} />
        <Route path="/ideas/:ideaId"    element={<IdeaDetailPage />} />
        <Route path="/messages"         element={<MessagesPage />} />
        <Route path="/profile"          element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
