import styled from "@emotion/styled";

export const Container = styled.div`
  position: relative;
  width: 100%;
`;

export const Input = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  outline: none;

  &:focus {
    border-color: #d6fb4b;
  }

  &:disabled {
    background: #f2f4f7;
    cursor: not-allowed;
    color: #98a2b3;
  }
`;

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
`;

export const Option = styled.div`
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #f5f5f5;
  }
`;

export const NoResults = styled.div`
  padding: 10px 12px;
  color: #667085;
  font-size: 14px;
`;