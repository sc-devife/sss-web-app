import styled from "@emotion/styled";
import {screen} from "../styles/screen";
import { NavLink } from "react-router-dom";

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

export const Profile = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 5px 6px 5px 6px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
  color: #4b5563;
`;

export const ProfileIcon = styled.span`
  font-size: 18px;
  height: 30px;
  width: 30px;
  border-radius: 50%;
  padding: 1px;
`;

export const Text = styled.span`
  font-size: 16px;
  margin-left: 8px;
  font-weight: 500;
  display: none;
  ${screen.tablet} {
    display: block;
  }
`;