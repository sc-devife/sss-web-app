import styled from "@emotion/styled";

export const Container = styled.div`
    width: 100%;
    min-width: 0;
`;

export const TopBar = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

export const AddDestinationButton = styled.button`  
 padding: 8px 16px;
  background-color: #D6FB4B;
  color: #000;
  border: none;
  font-weight: 500;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
`;

export const CardContainer = styled.div`
    display: flex;
    gap: 18px;
    margin-top: 12px;
`;

export const Card = styled.div`
    background-color: #fff;
    border-radius: 8px;
    padding: 12px;
    width: 100%;
    border: 1px solid #E0E0E0;
`;

export const CardTitle = styled.span`
    margin: 0;
    font-size: 12px;
    color: #333333;
    font-weight: 500;
`;

export const CardDescription = styled.p`

    font-size: 24px;
    font-weight: bold;
    color: #000;
`;

export const DestinationTable = styled.div`
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
    max-width: 100%;
  overflow: auto;
  min-width: 0;
`;

