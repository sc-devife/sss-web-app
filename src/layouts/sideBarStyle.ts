import styled from "@emotion/styled";
import { NavLink } from "react-router-dom";
import { screen } from "../styles/screen";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
}

export const Sidebar = styled.aside<SidebarProps>`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;

  height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;

  width: ${({ collapsed }) => (collapsed ? "4rem" : "14rem")};

  transform: ${({ mobileOpen }) =>
    mobileOpen ? "translateX(0)" : "translateX(-100%)"};

  transition: transform 0.3s ease;

  ${screen.tablet} {
    position: relative;
    transform: translateX(0);
  }
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1px;
  padding-right: 10px;
  padding-left: 10px;
  padding-top: 8px;
  height: 55px;
  border-bottom: 1px solid #e5e7eb;
`;

export const CollapseIcon = styled.span`
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4b5563;
  transition: color 0.3s ease;
  padding: 7px;
  border-radius: 8px;
  background-color: #e7f0c2;
  display: none;

  ${screen.tablet} {
    display: flex;
  }

  &:hover {
    background-color: #e4f0b6;
  }
`;

export const XIcon = styled.span`
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4b5563;
  transition: color 0.3s ease;
  padding: 7px;
  border-radius: 8px;
  background-color: #e7f0c2;

  &:hover {
    background-color: #e4f0b6;
  }

  ${screen.tablet} {
    display: none;
  }
`;

export const Menu = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 10px;
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