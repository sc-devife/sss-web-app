import React from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

interface SpinnerProps {
  size?: number;
  color?: string;
}

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinnerWrapper = styled.div<{ size: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
`;

const SpinnerCircle = styled.div<{ size: number; color: string }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
  border: ${({ size, color }) => `${size / 10}px solid ${color}`};
  border-top-color: transparent;
  animation: ${spin} 0.8s linear infinite;
`;

const Spinner: React.FC<SpinnerProps> = ({
  size = 20,
  color = "#000000",
}) => {
  return (
    <SpinnerWrapper size={size}>
      <SpinnerCircle size={size} color={color} />
    </SpinnerWrapper>
  );
};

export default Spinner;