import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaPowerOff, FaTimes } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import * as S from "./sideBarStyle";
import { dashboardRoute, routeGroups } from "../routes/ProtectedRouter";
import { useAppDispatch } from "../app/hooks";
import { logOutUser } from "../features/auth/authSlice";

interface SideBarProps {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideBar: React.FC<SideBarProps> = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const activeGroup = routeGroups.find((group) => group.routes.some((route) => location.pathname.startsWith(route.path)))?.id;
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(activeGroup ? [activeGroup] : ["organization"]);

  const closeMobile = () => setMobileOpen(false);
  const toggleGroup = (id: string) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((current) => current.includes(id) ? current : [...current, id]);
      return;
    }
    setOpenGroups((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handleLogout = () => {
    dispatch(logOutUser());
    navigate("/login", { replace: true });
  };

  const DashboardIcon = dashboardRoute.icon;

  return (
    <>
      <S.Backdrop mobileOpen={mobileOpen} onClick={closeMobile} aria-hidden="true" />
      <S.Sidebar collapsed={collapsed} mobileOpen={mobileOpen} aria-label="Primary navigation">
        <S.Logo collapsed={collapsed}>
          <S.BrandMark>SS</S.BrandMark>
          {!collapsed && <S.BrandText><strong>Smart Sales</strong><span>Travel workspace</span></S.BrandText>}
          <S.DesktopToggle type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </S.DesktopToggle>
          <S.MobileClose type="button" onClick={closeMobile} aria-label="Close navigation"><FaTimes /></S.MobileClose>
        </S.Logo>

        <S.Navigation>
          <S.PrimaryLink to={dashboardRoute.path} title={collapsed ? dashboardRoute.title : undefined} onClick={closeMobile}>
            <S.Icon><DashboardIcon /></S.Icon>{!collapsed && <S.Text>{dashboardRoute.title}</S.Text>}
          </S.PrimaryLink>

          <S.GroupList>
            {routeGroups.map((group) => {
              const GroupIcon = group.icon;
              const isOpen = (openGroups.includes(group.id) || group.id === activeGroup) && !collapsed;
              const isActive = group.id === activeGroup;
              return (
                <S.Group key={group.id}>
                  <S.GroupButton type="button" onClick={() => toggleGroup(group.id)} active={isActive} title={collapsed ? group.title : undefined} aria-expanded={isOpen} aria-controls={`nav-${group.id}`}>
                    <S.Icon><GroupIcon /></S.Icon>
                    {!collapsed && <><S.Text>{group.title}</S.Text><S.Chevron open={isOpen}><FiChevronDown /></S.Chevron></>}
                  </S.GroupButton>
                  {!collapsed && <S.Submenu id={`nav-${group.id}`} open={isOpen}>
                    {group.routes.map((route) => {
                      const RouteIcon = route.icon;
                      return <S.ChildLink key={route.path} to={route.path} onClick={closeMobile} end={route.path === "/bookings"}>
                        <RouteIcon aria-hidden="true" /><span>{route.title}</span>
                      </S.ChildLink>;
                    })}
                  </S.Submenu>}
                </S.Group>
              );
            })}
          </S.GroupList>
        </S.Navigation>

        <S.Footer>
          <S.Logout type="button" title={collapsed ? "Logout" : undefined} onClick={handleLogout}>
            <S.Icon><FaPowerOff /></S.Icon>{!collapsed && <S.Text>Logout</S.Text>}
          </S.Logout>
        </S.Footer>
      </S.Sidebar>
    </>
  );
};

export default SideBar;
