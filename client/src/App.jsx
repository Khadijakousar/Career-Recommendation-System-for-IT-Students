import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import CatalogPage from './pages/admin/CatalogPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import InterestAssessmentPage from './pages/student/InterestAssessmentPage.jsx';
import ProfilePage from './pages/student/ProfilePage.jsx';
import RecommendationsPage from './pages/student/RecommendationsPage.jsx';
import SkillsAssessmentPage from './pages/student/SkillsAssessmentPage.jsx';
import StudentHome from './pages/student/StudentHome.jsx';
import StudentLayout from './pages/student/StudentLayout.jsx';
import {
  ProtectedRoute,
  PublicAuthRoute,
  RoleRoute,
  SessionGate,
} from './routes/AuthRoutes.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route element={<SessionGate />}>
          <Route element={<PublicAuthRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute role="STUDENT" />}>
              <Route element={<StudentLayout />}>
                <Route path="/dashboard" element={<StudentHome />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/assessment/skills"
                  element={<SkillsAssessmentPage />}
                />
                <Route
                  path="/assessment/interests"
                  element={<InterestAssessmentPage />}
                />
                <Route
                  path="/recommendations"
                  element={<RecommendationsPage />}
                />
              </Route>
            </Route>
            <Route element={<RoleRoute role="ADMIN" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHome />} />
                <Route path=":section" element={<CatalogPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
