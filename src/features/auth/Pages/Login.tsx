import React, { useState } from "react";
import * as S from "./loginStyle";
import { IoLockClosedOutline, IoMailOutline } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../authThunk";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../app/store";
import AppToast from "../../../services/toastService";


const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const inputValidation = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;

    // Email validation
    if (!email || email.trim() === "") {
      newErrors.email = "Email is Required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Password validation
    if (!password || password.trim() === "") {
      newErrors.password = "Password is Required";
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "Password must be atleast 6 characters including uppercase, lowercase, number & special character.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputValidation()) {
      try {
        const res = await dispatch(loginUser({ email, password })).unwrap();
        console.log("Login successful:", res);
        AppToast.showSuccess("Login successful!");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Login failed:", error);
        AppToast.showError(error as string);
      }
    }
  };
  return (
    <S.Container>
      <S.RightPart>
        <S.RightPartMainCard>
          <S.RightPartLogo
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHB7m2IeYeQuefiQ3f3LIKCWO4wX7hQ7ZRbQ&s"
            alt="Logo"
          />
          <S.PageTitle>Welcome Back</S.PageTitle>
          <S.PageSubTitle>Sign in to access your workspace.</S.PageSubTitle>
          <S.LoginForm onSubmit={handleLogin}>
            <div style={{ width: "100%", textAlign: "left" }}>
              <S.Label>Email Address</S.Label>
            </div>
            <S.InputWrapper
              style={{
                marginTop: "0.2rem",
                marginBottom: errors.email ? "0.2rem" : "0.2rem",
              }}
            >
              <S.Input
                type="text"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <S.IconLeft>
                <IoMailOutline />
              </S.IconLeft>
            </S.InputWrapper>
            {errors.email && <S.Error>{errors.email}</S.Error>}

            <div style={{ width: "100%", textAlign: "left", marginTop: errors.email ? "0.2rem" : "0.2rem" }}>
              <S.Label>Password</S.Label>
            </div>
            <S.InputWrapper
              style={{
                marginTop: "0.2rem",
                marginBottom: errors.password ? "0.2rem" : "0.2rem",
              }}
            >
              <S.Input
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <S.IconLeft>
                <IoLockClosedOutline />
              </S.IconLeft>

              <S.IconRight onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </S.IconRight>
            </S.InputWrapper>
            
            {errors.password && <S.Error>{errors.password}</S.Error>}
            <S.ForgotPasswordLink href="/forgot-password">
              Forgot Password?
            </S.ForgotPasswordLink>
            <S.Button type="submit">Login</S.Button>
          </S.LoginForm>
          {/*<S.Divider>
            <hr />
            <S.Separator>OR</S.Separator> <hr />
          </S.Divider>
          <S.PageSubTitle>
            Don't have an account?{" "}
            <S.SignUpLink href="/signup">Sign Up</S.SignUpLink>{" "}
          </S.PageSubTitle>*/}
        </S.RightPartMainCard>
      </S.RightPart>
      <span style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.7rem" }}>
        © {new Date().getFullYear()} untitled UI Travel Operations. All rights
        reserved.
      </span>
    </S.Container>
  );
};

export default Login;
