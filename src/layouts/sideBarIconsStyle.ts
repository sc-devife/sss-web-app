import styled from "@emotion/styled";
import { NavLink } from "react-router-dom";

export const Sidebar = styled.aside`
  width: 4rem;
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
  gap: 3px;
`;

export const StyledNavLink = styled(NavLink)`
  position: relative;
  display: flex;
  align-items: center;
  padding: 5px 6px 2px 6px;
  width: fit-content;
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
    background-color: #d1d9f2;
    color: #5E81F4;
  }

  /* Vertical indicator */
  &.active::before {
    content: "";
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 90%;
    background-color: #5E81F4;
    border-radius: 4px;
  }
`;

export const Icon = styled.span`
  font-size: 25px;
`;