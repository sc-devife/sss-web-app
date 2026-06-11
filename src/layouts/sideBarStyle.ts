import styled from "@emotion/styled";
import { NavLink } from "react-router-dom";

export const Sidebar = styled.aside`
  width: 12rem;
  height: 100vh;
  padding: 10px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
`;

export const Logo = styled.div`
  font-size: 32px;
  color: #5E81F4;
  margin-bottom: 1px;
  padding-left: 3px;
`;

export const Menu = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const TopMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const BottomMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: auto;
`;

export const Profile = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 5px 6px 5px 6px;
  border-radius: 8px;
  text-decoration: none;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  color: #4b5563;

  &:hover {
    background-color: #f3f4f6;
  }

  &.active {
    background-color: #e7f0c2;
    color: #000000;
  }
`;

export const ProfileIcon = styled.span`
  font-size: 18px;
  height: 30px;
  width: 30px;
  border-radius: 50%;
  padding: 1px;
`;

export const StyledNavLink = styled(NavLink)`
  position: relative;
  display: flex;
  align-items: center;
  padding: 5px 6px 2px 6px;
  border-radius: 8px;
  text-decoration: none;
  color: #4b5563;
  transition: all 0.3s ease;
  line-height: 1;
  display: flex;

  &:hover {
    background-color: #f3f4f6;
  }

  &.active {
    background-color: #e7f0c2;
    color: #000000;
  }
`;

export const Icon = styled.span`
  font-size: 22px;
`;

export const Text = styled.span`
  font-size: 16px;
  margin-left: 8px;
  font-weight: 500;
  
  `;