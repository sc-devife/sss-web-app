import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import React from "react";
import LandingPage from "../features/landing/Pages/LandingPage";
import Login from "../features/auth/Pages/Login";
import ForgotPassword from "../features/auth/Pages/ForgotPassword";
import Register from "../features/auth/Pages/Register";
import VerifyOtp from "../features/auth/Pages/VerifyOtp";
import ProtectedRouter from "./ProtectedRouter";
import AuthChecking from "./AuthChecking";
import MainLayout from "../layouts/MainLayout";
import InviteUser from "../features/auth/Pages/InviteUser";

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite-user" element={<InviteUser />} />

        {/* Protected routes */}
        <Route element={<AuthChecking />}>
          <Route element={<MainLayout />}>
            {ProtectedRouter.map((route) => (
              <Route key={route.path} path={route.path} element={route.element}>
              </Route>
            ))}
          </Route>
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
