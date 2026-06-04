import React, { useRef, useState, useEffect } from "react";
import * as S from "./loginStyle";

interface Props {}

const VerifyOtp = (props: Props) => {
  const [email, setEmail] = useState<string>("sanat@gmail.com");
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any = null;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }

    return () => clearInterval(interval);
  }, [timer]);

  const inputValidation = () => {
    const newErrors: { otp?: string } = {};

    if (otp.join("").length !== 4) {
      newErrors.otp = "Please enter a valid 4-digit OTP";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value.replace(/\D/g, "");

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move focus to next input
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear OTP error when user types
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: undefined }));
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResend = () => {
    // Resend OTP API call
    setTimer(120);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValidation()) {
      console.log("Email:", email);
      console.log("OTP:", otp);
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
          <S.PageTitle>Verify your Email</S.PageTitle>
          <S.PageSubTitle>
            We’ve sent an activation code to your Email <b>{email}</b>
          </S.PageSubTitle>
          <S.OtpForm onSubmit={handleSubmit}>
            <S.OtpContainer>
              {otp.map((digit, index) => (
                <S.OtpInput
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  hasError={!!errors.otp}
                  onChange={(e) => handleChange(e, index)}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              ))}
            </S.OtpContainer>

            <S.ErrorContainer>
              {errors.otp && <S.ErrorText>{errors.otp}</S.ErrorText>}
            </S.ErrorContainer>

            <S.Button type="submit">Verify Email</S.Button>
          </S.OtpForm>

          <S.PageSubTitle>
            Didn't receive the code?{" "}
            {timer > 0 ? (
              <span>Resend in {formatTime(timer)}</span>
            ) : (
              <S.SignUpLink type="button" onClick={handleResend}>
                Resend
              </S.SignUpLink>
            )}
          </S.PageSubTitle>
        </S.RightPartMainCard>
      </S.RightPart>
      <span style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.7rem" }}>
        © {new Date().getFullYear()} untitled UI Travel Operations. All rights
        reserved.
      </span>
    </S.Container>
  );
};

export default VerifyOtp;
