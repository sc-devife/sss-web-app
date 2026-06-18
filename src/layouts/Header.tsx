import React from "react";
import { useLocation } from "react-router-dom";
import * as S from "./headerStyle";
import ProtectedRouter from "../routes/ProtectedRouter";
import { HiOutlineMenu } from "react-icons/hi";

interface HeaderProps {
  onMobileMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuClick }) => {
  const location = useLocation();

  let title = "SSS Web App";

  const activeRoute = ProtectedRouter.find((route) =>
    location.pathname.startsWith(route.path),
  );

  if (activeRoute) {
    title = activeRoute.title;
  }

  return (
    <S.HeaderContainer>
      <S.MenuTitle>
        <S.MenuIconWrapper
          onClick={() => {
            onMobileMenuClick();
          }}
        >
          <HiOutlineMenu size={18} />
        </S.MenuIconWrapper>
        {title}
      </S.MenuTitle>
      <S.Profile to="/profile" title="Profile">
        <S.ProfileIcon>
          <img
            src="https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg?w=1200&h=992&fl=progressive&q=70&fm=jpg"
            alt="Profile"
            style={{ borderRadius: "50%", width: "100%", height: "100%" }}
          />
        </S.ProfileIcon>
        <S.Text>John Doe</S.Text>
      </S.Profile>
    </S.HeaderContainer>
  );
};

export default Header;
