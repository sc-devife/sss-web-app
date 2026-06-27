import styled from "@emotion/styled";
import { screen } from "../../styles/screen";

export const Container = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const Content = styled.div`
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;

  background: #fff;
  border-radius: 16px;
  padding: 16px;

  ${screen.tablet} {
    width: 90%;
    padding: 24px;
    max-width: 80vw;
  }
`;

export const Header = styled.div`
  margin-bottom: 24px;
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

export const SubTitle = styled.p`
  margin-top: 2px;
  color: #667085;
  font-size: 12px;
  margin-bottom: 8px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  ${screen.tablet} {
    grid-template-columns: 1fr 1fr;
  }
`;

export const Field = styled.div`
  width: 100%;
`;

export const Label = styled.label`
  font-size: 12px;
`;

export const Input = styled.input`
  box-sizing: border-box;

  height: 40px;
  padding: 0 12px;
  width: 100%;

  border: 1px solid #d0d5dd;
  border-radius: 8px;
  outline: none;

  &:focus {
    border-color: #d6fb4b;
  }
`;

export const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  resize: vertical;
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export const CancelButton = styled.button`
  padding: 10px 20px;
  border: 1px solid #d0d5dd;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
`;

export const SubmitButton = styled.button`
  padding: 10px 20px;
  border: none;
  background: #d6fb4b;
  color: #000;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
`;

export const ErrorText = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  margin: 0;
`;

export const SourceTypeContainer = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
`;

export const ContainerLabel = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
`;

export const SourceType = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;

  ${screen.tablet} {
    justify-content: flex-start;
    gap: 16px;
  }
`;

export const SourceItem = styled.div<{ $selected: boolean }>`
  position: relative;

  width: 80px;
  height: 80px;

  border-radius: 10px;
  cursor: pointer;

  border: 1px solid ${({ $selected }) => ($selected ? "#b7d62d" : "#d1d5db")};
  background: ${({ $selected }) => ($selected ? "#f8fce8" : "#fff")};

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;

  transition: 0.2s;

  &:hover {
    border-color: #b7d62d;
    background: #f8fce8;
  }

  ${screen.tablet} {
    width: 90px;
    height: 90px;
    gap: 10px;
  }
`;

export const SourceIcon = styled.div`
  font-size: 20px;
  color: #374151;

  display: flex;
  align-items: center;
  justify-content: center;

  ${screen.tablet} {
    font-size: 24px;
  }
`;

export const SourceName = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: #374151;
  text-align: center;
  line-height: 1.2;

  ${screen.tablet} {
    font-size: 13px;
  }
`;

export const CheckMark = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;

  width: 18px;
  height: 18px;

  border-radius: 50%;
  background: #d6fb4b;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 10px;
  color: #000;
`;
