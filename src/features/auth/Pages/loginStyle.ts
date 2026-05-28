import styled from "@emotion/styled";
import { screen } from "../../../styles/screen";

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100%;
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
  max-width: 400px;
  padding: 2rem;
  border-radius: 12px;
`;

export const RightPartLogo = styled.img`
  width: 150px;
  height: auto;
`;

export const PageSubTitle = styled.p`
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
`;

export const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

export const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const Label = styled.label`
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  background: white;
  padding: 0 15px;
  margin: 0 10px;
  font-size: 0.9rem;
  color: #666;
  pointer-events: none;
  transition: 0.2s ease all;
`;

export const Input = styled.input`
  padding: 0.9rem 2.5rem 0.9rem 2.5rem;
  border: 1.5px solid #009ee2;
  border-radius: 8px;
  width: 100%;
  outline: none;
  font-size: 1rem;
  background: transparent;
  box-sizing: border-box;
  &:focus {
    border-color: #007bb5;
  }

  &:focus + label,
  &:not(:placeholder-shown) + label {
    top: -1px;
    left: 10px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #009ee2;
  }
`;

export const IconLeft = styled.div`
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-40%);
  color: #007bb5;
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
  width: fit-content;
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  background-color: #009ee2;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
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
  margin-top: 0.2rem;
  width: 100%;
`;
