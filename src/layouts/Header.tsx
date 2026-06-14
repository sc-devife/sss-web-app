import React from "react";
import { useLocation } from "react-router-dom";
import * as S from "./headerStyle";
import ProtectedRouter from "../routes/ProtectedRouter";
import { HiOutlineMenu } from "react-icons/hi";

const Header: React.FC = () => {
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
        <S.MenuIconWrapper>
          <HiOutlineMenu />
        </S.MenuIconWrapper>
        {title}
      </S.MenuTitle>
    </S.HeaderContainer>
  );
};

export default Header;