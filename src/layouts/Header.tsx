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
    location.pathname.startsWith(route.path)
  );

  if (activeRoute) {
    title = activeRoute.title;
  }

  return (
    <S.HeaderContainer>
      <S.MenuTitle>
        <S.MenuIconWrapper onClick={() => {onMobileMenuClick();}}>
          <HiOutlineMenu size={18} />
        </S.MenuIconWrapper>
        {title}
      </S.MenuTitle>
    </S.HeaderContainer>
  );
};

export default Header;