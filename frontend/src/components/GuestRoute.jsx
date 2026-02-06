import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

const GuestRoute = () => {
  const isAuthenticated = localStorage.getItem('token');

  useEffect(() => {
    if (isAuthenticated) {
      toast.error("User already logged in",{ id: "already-logged-in" });
    }
  }, [isAuthenticated]);

  return isAuthenticated ? <Navigate to="/chat" /> : <Outlet />;
};

export default GuestRoute;
