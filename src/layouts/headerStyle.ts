import styled from "@emotion/styled";
import {screen} from "../styles/screen";

export const HeaderContainer = styled.header`
   width: 100%;
  height: 3.5rem;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #ddd;
`;

export const MenuTitle = styled.div`
display: flex;
align-items: center;
gap: 8px;
font-size: 1rem;
font-weight: 600;
color: #333;
`;

export const MenuIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F5FA;
  border-radius: 6px;
  cursor: pointer;
  padding: 6px 8px;
  font-size: 0.8rem;
   display: block;
  ${screen.tablet} {
    display: none;
  }
`;

export const MenuIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const RightIcons = styled.div`
  display: flex;
    align-items: center;
    gap: 10px;
`;

export const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F5FA;
  border-radius: 6px;
  cursor: pointer;
  padding: 8px;
  font-size: 0.8rem;
`;