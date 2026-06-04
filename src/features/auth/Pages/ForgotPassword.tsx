import React, { useState } from "react";
import * as S from "./loginStyle";
import { IoMailOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

interface Props {}

const ForgotPassword = (props: Props) => {
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<{ email?: string }>({});

  const navigate = useNavigate();

  const inputValidation = () => {
    const newErrors: { email?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValidation()) {
      navigate("/verify-otp");
    }
  };
  return (
    <S.Container>
      <S.RightPart>
        <S.RightPartMainCard>
          <S.RightPartLogo
            src="https://cdn.prod.website-files.com/61ed56ae9da9fd7e0ef0a967/61f12d35fce2ed41dbb7ef3b_BlossomDefault.svg"
            alt="Logo"
          />
          <S.PageTitle>Reset Password</S.PageTitle>
          <S.PageSubTitle>
            Enter email address to reset your password.
          </S.PageSubTitle>
          <S.LoginForm onSubmit={handleSubmit}>
            <div style={{ width: "100%", textAlign: "left" }}>
              <S.Label>Email Address</S.Label>
            </div>
            <S.InputWrapper
              style={{
                marginTop: "0.2rem",
                marginBottom: errors.email ? "0.2rem" : "0.5rem",
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

            <S.Button type="submit">Send on Email</S.Button>
          </S.LoginForm>
          <S.Divider>
            <hr />
            <S.Separator>OR</S.Separator> <hr />
          </S.Divider>
          <S.PageSubTitle>
            <S.SignUpLink href="/login">Back to Sign in?</S.SignUpLink>{" "}
          </S.PageSubTitle>
        </S.RightPartMainCard>
      </S.RightPart>
      <span style={{ fontSize: "0.8rem", color: "#666" }}>
        © {new Date().getFullYear()} untitled UI Travel Operations. All rights
        reserved.
      </span>
    </S.Container>
  );
};

export default ForgotPassword;
