import React from "react";
import * as S from "./sideBarStyle";
import ProtectedRouter from "../routes/ProtectedRouter";

const SideBar: React.FC = () => {
  const icons = ProtectedRouter.map((route) => ({
    path: route.path,
    name: route.title,
    icon: route.icon,
    title: route.title,
    position: route.position,
  }));

  return (
    <S.Sidebar>
      {/* Logo */}
      <S.Logo>
        CRM
      </S.Logo>

      {/* Menu*/}
      <S.Menu>
  <S.TopMenu>
    {icons.map((item) =>
      item.position === "top" && (
        <div key={item.path} title={item.name}>
          <S.StyledNavLink to={item.path}>
            <S.Icon>{item.icon}</S.Icon>
            <S.Text>{item.title}</S.Text>
          </S.StyledNavLink>
        </div>
      )
    )}
  </S.TopMenu>

  <S.BottomMenu>
    {icons.map((item) =>
      item.position === "bottom" && (
        <div key={item.path} title={item.name}>
          <S.StyledNavLink to={item.path}>
            <S.Icon>{item.icon}</S.Icon>
            <S.Text>{item.title}</S.Text>
          </S.StyledNavLink>
        </div>
      )
    )}
    <S.Profile to="/profile">
      <S.ProfileIcon>
        <img
          src="https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg?w=1200&h=992&fl=progressive&q=70&fm=jpg"
          alt="Profile"
          style={{ borderRadius: "50%", width: "100%", height: "100%" }}
        />
      </S.ProfileIcon>
      <S.Text>John Doe</S.Text>
    </S.Profile>
  </S.BottomMenu>
</S.Menu>
    </S.Sidebar>
  );
};

export default SideBar;