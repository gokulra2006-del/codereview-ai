import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // Don't flash redirect while restoring session

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
