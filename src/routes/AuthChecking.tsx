import React from "react";
import {useLocation, Outlet, Navigate } from "react-router-dom";

const AuthChecking: React.FC = () => {
    //authentication checking logic
    const location = useLocation();
    const isAuthenticated = true;
    const isCheckingAuth = false;

    if (isCheckingAuth) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default AuthChecking;