import React from "react";
import { useLocation } from "react-router-dom";
import { HiOutlineMenu } from "react-icons/hi";
import * as S from "./headerStyle";
import { findRouteByPath } from "../routes/ProtectedRouter";
import storageService from "../services/localStorage";

interface HeaderProps { onMobileMenuClick: () => void; }

const Header: React.FC<HeaderProps> = ({ onMobileMenuClick }) => {
  const location = useLocation();
  const user = (storageService.getItem("user") as { name?: string } | null) ?? null;
  const title = findRouteByPath(location.pathname)?.title ?? "SSS Web App";

  return (
    <S.HeaderContainer>
      <S.MenuTitle>
        <S.MenuIconWrapper as="button" onClick={onMobileMenuClick} aria-label="Open navigation">
          <HiOutlineMenu size={18} />
        </S.MenuIconWrapper>
        {title}
      </S.MenuTitle>
      <S.Profile to="/profile" title="Profile">
        <S.ProfileIcon>
          <img src="https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg?w=1200&h=992&fl=progressive&q=70&fm=jpg" alt="Profile" style={{ borderRadius: "50%", width: "100%", height: "100%" }} />
        </S.ProfileIcon>
        <S.Text>{user?.name || "User"}</S.Text>
      </S.Profile>
    </S.HeaderContainer>
  );
};

export default Header;
