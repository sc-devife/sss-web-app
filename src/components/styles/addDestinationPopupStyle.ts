import styled from "@emotion/styled";

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
  width: 500px;
  max-width: 90vw;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
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
  gap: 20px;
`;

export const FormGroup = styled.div`
 margin-top: 14px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
`;

export const Label = styled.label`
  font-size: 12px;
`;

export const Input = styled.input`
  height: 44px;
  padding: 0 12px;
  width: 100%;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  outline: none;
  &:focus {
    border-color: #D6FB4B;
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