import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import RegisterSuccess from "./components/RegisterSuccess/RegisterSuccess";
import VerifyEmail from "./components/VerifyEmail/VerifyEmail";
import ResetPasswordEmail from "./components/ResetPasswordEmail/ResetPasswordEmail";
import ResetSuccess from "./components/ResetSuccess/ResetSuccess";
import NotFound from "./components/NotFound/NotFound";
import AuthService from "./services/AuthService";

const UnProtectedRoute = ({ element }) => {
  const isAuthenticated =
    AuthService.isLoggedIn() && !!AuthService.getUserData();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : element;
};

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = AuthService.isLoggedIn();
  const user = AuthService.getUserData();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return element;
};


function App() {
  return (
    <Router>
      <Routes>
        {/* Unprotected Routes */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route
          path="/login"
          element={<UnProtectedRoute element={<Login />} />}
        />

        <Route
          path="/register"
          element={<UnProtectedRoute element={<Register />} />}
        />
        <Route
          path="/register-success"
          element={<UnProtectedRoute element={<RegisterSuccess />} />}
        />
        <Route
          path="/forgot-password"
          element={<UnProtectedRoute element={<ForgotPassword />} />}
        />

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPasswordEmail />} />
        <Route path="/reset-success" element={<ResetSuccess />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<Dashboard />} />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
