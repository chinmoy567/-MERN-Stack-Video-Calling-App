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
import AuthService from "./services/AuthService";

const UnProtectedRoute = ({ element }) => {
  const isAuthenticated = AuthService.isLoggedIn();
  return isAuthenticated ? <Navigate to="/dashboard" /> : element;
};

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = AuthService.isLoggedIn();
  return isAuthenticated ? element : <Navigate to="/login" />;
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
          path="/forgot-password"
          element={<UnProtectedRoute element={<ForgotPassword />} />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<Dashboard />} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
