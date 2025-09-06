import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "./useAuth";

export default function RequireAuth({ children }) {
  const { isAuthed, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{padding:20}}>Loading...</div>;
  if (!isAuthed) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
}
