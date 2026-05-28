import React, { useState } from "react";
import AuthLeftPart from "../components/AuthLeftPart";
import * as S from "./loginStyle";
import { IoMailOutline } from "react-icons/io5";

interface Props {}

const ForgotPassword = (props: Props) => {
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<{ email?: string; }>({});

  const inputValidation = () => {
    const newErrors: { email?: string;} = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValidation()) {
      console.log("Email:", email);
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
          <S.PageSubTitle>Forgot your password?</S.PageSubTitle>
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

            <S.Button type="submit">Send on Email</S.Button>
          </S.LoginForm>
          <S.Divider>
            <hr />
            <S.Separator>OR</S.Separator> <hr />
          </S.Divider>
          <S.PageSubTitle>
            Back to Sign In?{" "}
            <S.SignUpLink href="/login">Sign In</S.SignUpLink>{" "}
          </S.PageSubTitle>
        </S.RightPartMainCard>
      </S.RightPart>
    </S.Container>
  );
};

export default ForgotPassword;
