import React, { useEffect, useState } from "react";
import { useLocation, Outlet, Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { restoreUser } from "../features/auth/authThunk";

const AuthChecking: React.FC = () => {
  //authentication checking logic
  const location = useLocation();
  //Authentication check
//   const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isAuthenticated = true;
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        await dispatch(restoreUser());
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [dispatch, isAuthenticated]);

  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default AuthChecking;
