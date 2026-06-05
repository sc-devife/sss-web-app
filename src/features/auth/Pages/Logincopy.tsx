import React, { useState } from "react";
import AuthLeftPart from "../components/AuthLeftPart";
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
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const inputValidation = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;

    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!passwordRegex.test(password)) {
      newErrors.password = "Password must be atleast 6 characters including uppercase, lowercase, number & special character.";
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
      <S.LeftPart>
        <AuthLeftPart />
      </S.LeftPart>
      <S.RightPart>
        <S.RightPartMainCard>
          <S.RightPartLogo
            src="https://cdn.prod.website-files.com/61ed56ae9da9fd7e0ef0a967/61f12d35fce2ed41dbb7ef3b_BlossomDefault.svg"
            alt="Logo"
          />
          <S.PageSubTitle>Login with Email</S.PageSubTitle>
          <S.LoginForm onSubmit={handleLogin}>
            <S.InputWrapper style={{marginTop: "1rem"}}>
              <S.Input
                type="text"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <S.Label>Email</S.Label>
              <S.IconLeft>
                <IoMailOutline />
              </S.IconLeft>
            </S.InputWrapper>
            {errors.email && <S.Error>{errors.email}</S.Error>}

            <S.InputWrapper style={{ marginTop: errors.email ? "0.5rem" : "1.2rem" }}>
              <S.Input
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <S.Label>Password</S.Label>

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
          <S.Divider>
            <hr />
            <S.Separator>OR</S.Separator> <hr />
          </S.Divider>
          <S.PageSubTitle>
            Don't have an account?{" "}
            <S.SignUpLink href="/signup">Sign Up</S.SignUpLink>{" "}
          </S.PageSubTitle>
        </S.RightPartMainCard>
      </S.RightPart>
    </S.Container>
  );
};

export default Login;
