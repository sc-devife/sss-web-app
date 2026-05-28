import styled from "@emotion/styled";
import { NavLink } from "react-router-dom";

export const Sidebar = styled.aside`
  width: 15rem;
  height: 100vh;
  padding: 10px;
  background-color: #ffffff;
  border-right: 1px solid #ebe7e7;
  display: flex;
  flex-direction: column;
`;

export const Logo = styled.div`
  font-size: 6rem;
  color: #5E81F4;
  margin-top: 1rem;
  padding-left: 4px;
  line-height: 1;
  display: flex;
`;

export const WelcomeText = styled.div`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1px;
  padding-left: 4px;
`;

export const UserName = styled.div`
  font-size: 1.5rem;
  color: #000000;
  padding-left: 4px;
  font-weight: 600;
`;

export const ChildRoutes = styled.nav`
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
`;

export const StyledNavLink = styled(NavLink)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.5rem 1rem;
  color: #000000;
  background-color: #F5F5FA;
  text-decoration: none;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  &.active {
    background-color: #5E81F4;
    color: #fff;
  }
  &:hover {
    background-color: #f0f0f0;
  }
`;

export const ChildRoute = styled(StyledNavLink)`
  &.active {
    background-color: #5E81F4;
    color: #fff;
  }
`;

export const Icon = styled.div`
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;