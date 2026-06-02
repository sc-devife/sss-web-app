import React, { useRef, useState } from "react";
import * as S from "./loginStyle";

interface Props {}

const VerifyOtp = (props: Props) => {
  const [email, setEmail] = useState<string>("sanat@gmail.com");
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
  index: number
) => {
  if (e.key === "Backspace" && !otp[index] && index > 0) {
    inputRefs.current[index - 1]?.focus();
  }
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
            We’ve sent an SMS with an activation code to your Email{" "}
            <b>{email}</b>
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
            I didn't receive a code?{" "}
            <S.SignUpLink href="/signup">Resend</S.SignUpLink>{" "}
          </S.PageSubTitle>
        </S.RightPartMainCard>
      </S.RightPart>
    </S.Container>
  );
};

export default VerifyOtp;
