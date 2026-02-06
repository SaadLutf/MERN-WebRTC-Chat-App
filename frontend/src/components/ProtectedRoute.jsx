import React from 'react'
import { Navigate,Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
const ProtectedRoute = () => {
    const isAuthenticated=localStorage.getItem('token')
     useEffect(() => {
    if (!isAuthenticated) {
      toast.error("User not logged in ",{ id: "already-logged-in" });
    }
  }, [isAuthenticated]);
  return (
    isAuthenticated? <Outlet />: <Navigate to="/login" replace/>
  )
}

export default ProtectedRoute