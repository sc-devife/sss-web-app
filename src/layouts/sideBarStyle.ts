import styled from "@emotion/styled";
import { NavLink } from "react-router-dom";
import { screen } from "../styles/screen";

const focusRing = `&:focus-visible { outline: 3px solid rgba(135, 157, 61, .35); outline-offset: 2px; }`;

export const Backdrop = styled.div<{ mobileOpen: boolean }>`
  position: fixed; inset: 0; z-index: 999; background: rgba(15, 23, 42, .46);
  opacity: ${({ mobileOpen }) => mobileOpen ? 1 : 0}; pointer-events: ${({ mobileOpen }) => mobileOpen ? "auto" : "none"};
  transition: opacity .2s ease;
  ${screen.tablet} { display: none; }
`;

export const Sidebar = styled.aside<{ collapsed: boolean; mobileOpen: boolean }>`
  position: fixed; inset: 0 auto 0 0; z-index: 1000; width: ${({ collapsed }) => collapsed ? "72px" : "260px"};
  display: flex; flex-direction: column; background: #ffffff; color: #17210b; border-right: 1px solid #e5e7eb;
  transform: ${({ mobileOpen }) => mobileOpen ? "translateX(0)" : "translateX(-100%)"};
  transition: width .22s ease, transform .22s ease; box-shadow: 16px 0 38px rgba(15, 23, 42, .08);
  @media (max-width: 767px) { width: min(86vw, 300px); }
  ${screen.tablet} { position: relative; transform: none; box-shadow: none; flex: 0 0 auto; }
`;

export const Logo = styled.div<{ collapsed: boolean }>`
  min-height: 68px; display: flex; align-items: center; gap: 10px; padding: ${({ collapsed }) => collapsed ? "12px 10px" : "12px 14px"};
  border-bottom: 1px solid #e5e7eb;
`;
export const BrandMark = styled.span`width: 38px; height: 38px; flex: 0 0 38px; display: grid; place-items: center; border-radius: 11px; background: #e7f0c2; font-size: 14px; font-weight: 800;`;
export const BrandText = styled.span`min-width: 0; display: flex; flex: 1; flex-direction: column; line-height: 1.2; strong { font-size: 14px; } span { margin-top: 3px; color: #64748b; font-size: 11px; }`;
const IconButton = styled.button`width: 30px; height: 30px; border: 0; border-radius: 8px; display: grid; place-items: center; color: #475569; background: #f4f6ef; cursor: pointer; ${focusRing} &:hover { background: #e7f0c2; color: #17210b; }`;
export const DesktopToggle = styled(IconButton)`@media (max-width: 767px) { display: none; }`;
export const MobileClose = styled(IconButton)`margin-left: auto; ${screen.tablet} { display: none; }`;

export const Navigation = styled.nav`flex: 1; min-height: 0; overflow-y: auto; padding: 12px 10px; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;`;
export const GroupList = styled.div`display: flex; flex-direction: column; gap: 3px; margin-top: 5px;`;
export const Group = styled.div`display: flex; flex-direction: column;`;
export const Icon = styled.span`width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; font-size: 20px;`;
export const Text = styled.span`min-width: 0; flex: 1; text-align: left; font-size: 14px; font-weight: 650; white-space: nowrap;`;

const rowStyles = `min-height: 42px; width: 100%; display: flex; align-items: center; gap: 7px; padding: 4px 7px; border-radius: 10px; color: #475569; text-decoration: none; transition: background .15s ease, color .15s ease;`;
export const PrimaryLink = styled(NavLink)`
  ${rowStyles} ${focusRing}
  &:hover { background: #f4f6ef; color: #17210b; }
  &.active { background: #e7f0c2; color: #17210b; }
`;
export const GroupButton = styled.button<{ active: boolean }>`
  ${rowStyles} ${focusRing} border: 0; cursor: pointer; background: ${({ active }) => active ? "#f4f6ef" : "transparent"};
  &:hover { background: #f4f6ef; color: #17210b; }
`;
export const Chevron = styled.span<{ open: boolean }>`display: grid; place-items: center; font-size: 17px; transform: rotate(${({ open }) => open ? "180deg" : "0"}); transition: transform .18s ease;`;
export const Submenu = styled.div<{ open: boolean }>`display: ${({ open }) => open ? "flex" : "none"}; flex-direction: column; gap: 2px; margin: 2px 0 5px 17px; padding-left: 17px; border-left: 1px solid #e5e7eb;`;
export const ChildLink = styled(NavLink)`
  min-height: 36px; display: flex; align-items: center; gap: 10px; padding: 7px 9px; border-radius: 8px; color: #64748b; text-decoration: none; font-size: 13px; font-weight: 550; ${focusRing}
  svg { flex: 0 0 17px; font-size: 17px; }
  &:hover { background: #f4f6ef; color: #17210b; }
  &.active { background: #e7f0c2; color: #17210b; font-weight: 700; }
`;
export const Footer = styled.div`flex: 0 0 auto; padding: 10px; border-top: 1px solid #e5e7eb;`;
export const Logout = styled.button`
  ${rowStyles} ${focusRing} border: 1px solid #f0c1c4; cursor: pointer; background: #ffffff; color: #b4232d;
  &:hover { background: #f15a67; border-color: #f15a67; color: #ffffff; }
`;
