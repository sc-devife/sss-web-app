import styled from "@emotion/styled";
import { screen } from "../../../styles/screen";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
`;

export const LeftPart = styled.div`
  display: none;
  flex: 1;
  padding: 1rem;

  ${screen.sm} {
    display: block;
  }
`;

export const RightPart = styled.div`
  flex: 1;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const RightPartMainCard = styled.div`
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 450px;
  padding: 2rem;
  border-radius: 12px;
  ${screen.tablet} {
    min-width: 450px;
  }
`;

export const RightPartLogo = styled.img`
  width: 150px;
  height: auto;
`;

export const PageTitle = styled.p`
  margin-top: 0.5rem;
  color: #000000;
  font-size: 1.25rem;
  font-weight: bold;
`;

export const PageSubTitle = styled.p`
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
`;

export const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  margin-top: 0.7rem;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

export const InputWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 0.5rem;
`;

export const Label = styled.label`
  font-size: 0.8rem;
`;

export const Input = styled.input`
  padding: 0.7rem 2rem 0.7rem 2rem;
  border: 1.5px solid #ccc;
  border-radius: 8px;
  width: 100%;
  outline: none;
  font-size: 1rem;
  background: transparent;
  box-sizing: border-box;
  &:focus {
    border-color: #D6FB4B;
  }
`;

export const IconLeft = styled.div`
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-40%);
  color: #ccc;
  font-size: 1.1rem;
  pointer-events: none;
`;

export const IconRight = styled.div`
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-40%);
  color: #666;
  font-size: 1.1rem;
  cursor: pointer;
`;

export const ForgotPasswordLink = styled.a`
  align-self: flex-end;
  margin: 0.5rem 0;
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
  &:hover {
    text-decoration: underline;
  }
`;

export const Button = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  background-color: #D6FB4B;
  color: #000000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #c5e63a;
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 1rem;
  hr {
    flex: 1;
    border: none;
    height: 1px;
    border-top: 1px solid #ccc;
  }
`;

export const Separator = styled.div`
  color: #000;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 1rem;
`;

export const SignUpLink = styled.a`
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
  &:hover {
    text-decoration: underline;
  }
`;

export const Error = styled.div`
  color: red;
  font-size: 0.8rem;
  width: 100%;
`;

export const OtpForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 1rem;
  
`;

export const OtpContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
`;

export const OtpInput = styled.input<{ hasError?: boolean }>`
  width: 3.5rem;
  height: 3.5rem;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid
    ${({ hasError }) => (hasError ? "#ef4444" : "#d1d5db")};
  background-color: ${({ hasError }) =>
    hasError ? "#fef2f2" : "#ffffff"};

  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ hasError }) =>
      hasError ? "#ef4444" : "#D6FB4B"};
    box-shadow: 0 0 0 2px
      ${({ hasError }) =>
        hasError ? "rgba(239,68,68,0.3)" : "rgba(211, 240, 116, 0.3)"};
  }
`;

export const ErrorContainer = styled.div`
  min-height: 1rem;
`;

export const ErrorText = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
`;