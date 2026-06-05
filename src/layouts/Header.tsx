import React from "react";
import { useLocation } from "react-router-dom";
import * as S from "./headerStyle";
import ProtectedRouter from "../routes/ProtectedRouter";
import { CiCirclePlus } from "react-icons/ci";
import { LiaSearchSolid } from "react-icons/lia";
import { HiOutlineMenu } from "react-icons/hi";

const Header: React.FC = () => {
  const location = useLocation();

  let title = "SSS Web App";

  const activeRoute = ProtectedRouter.find((route) =>
    location.pathname.startsWith(route.path)
  );

  if (activeRoute) {
    //Check child routes first
    const activeChild = activeRoute.childRoutes?.find((child) =>
      location.pathname === child.path
    );

    title = activeChild?.title || activeRoute.title;
  }

  return (
    <S.HeaderContainer>
      <S.MenuTitle>
        <S.MenuIconWrapper>
          <HiOutlineMenu />
        </S.MenuIconWrapper>
        {title}
      </S.MenuTitle>
      <S.RightIcons>
        <S.IconWrapper>
          <LiaSearchSolid />
        </S.IconWrapper>
        <S.IconWrapper>
          <CiCirclePlus />
        </S.IconWrapper>
      </S.RightIcons>
    </S.HeaderContainer>
  );
};

export default Header;