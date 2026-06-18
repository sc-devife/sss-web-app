import React, { useEffect, useState } from "react";
import * as S from "./sideBarStyle";
import ProtectedRouter from "../routes/ProtectedRouter";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { FaPowerOff } from "react-icons/fa6";
import { useNavigate} from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { logOutUser } from "../features/auth/authSlice";

interface SideBarProps {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideBar: React.FC<SideBarProps> = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const icons = ProtectedRouter.map((route) => ({
    path: route.path,
    name: route.title,
    icon: route.icon,
    title: route.title,
    position: route.position,
  }));

  const handleLogout = () => {
    console.log("Logout");
    dispatch(logOutUser());
    navigate("/login", { replace: true });
  };

  return (
    <S.Sidebar collapsed={collapsed} mobileOpen={mobileOpen}>
      {/* Logo */}
      <S.Logo>
        <h1 style={{ display: collapsed ? "none" : "inline" }}>CRM</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <S.CollapseIcon onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? (
              <FaChevronRight size={16} color="black" />
            ) : (
              <FaChevronLeft size={16} color="black" />
            )}
          </S.CollapseIcon>
          <S.XIcon onClick={() => setMobileOpen(false)}>
            <FaTimes size={16} color="black" />
          </S.XIcon>
        </div>
      </S.Logo>

      {/* Menu*/}
      <S.Menu
        onClick={() => {
          setMobileOpen(false);
        }}
      >
        <S.TopMenu>
          {icons.map(
            (item) =>
              item.position === "top" && (
                <div key={item.path} title={item.name}>
                  <S.StyledNavLink to={item.path}>
                    <S.Icon>{item.icon}</S.Icon>
                    <S.Text style={{ display: collapsed ? "none" : "inline" }}>
                      {item.title}
                    </S.Text>
                  </S.StyledNavLink>
                </div>
              ),
          )}
        </S.TopMenu>

        <S.BottomMenu>
          {icons.map(
            (item) =>
              item.position === "bottom" && (
                <div key={item.path} title={item.name}>
                  <S.StyledNavLink to={item.path}>
                    <S.Icon>{item.icon}</S.Icon>
                    <S.Text style={{ display: collapsed ? "none" : "inline" }}>
                      {item.title}
                    </S.Text>
                  </S.StyledNavLink>
                </div>
              ),
          )}
          {/*<S.Profile to="/profile" title="Profile">
            <S.ProfileIcon>
              <img
                src="https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg?w=1200&h=992&fl=progressive&q=70&fm=jpg"
                alt="Profile"
                style={{ borderRadius: "50%", width: "100%", height: "100%" }}
              />
            </S.ProfileIcon>
            <S.Text style={{ display: collapsed ? "none" : "inline" }}>
              John Doe
            </S.Text>
          </S.Profile>*/}


          <S.Logout title="Logout" onClick= {handleLogout}>
            <S.LogoutIcon>
              <FaPowerOff size={20} />
            </S.LogoutIcon>
            <S.Text style={{ display: collapsed ? "none" : "inline", fontWeight: "bold", }}>
              Logout
            </S.Text>
          </S.Logout>

        </S.BottomMenu>
      </S.Menu>
    </S.Sidebar>
  );
};

export default SideBar;
