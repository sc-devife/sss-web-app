import React from "react";
import * as S from "./childSideBarStyle";
import { TbSquareRoundedLetterCFilled } from "react-icons/tb";
import ProtectedRouter from "../routes/ProtectedRouter";
import { useLocation } from "react-router-dom";

const ChildSideBar: React.FC = () => {
  const location = useLocation();

  const activeRoute = ProtectedRouter.find((route) =>
    location.pathname.startsWith(route.path)
  );

  const childRoutes = activeRoute?.childRoutes || [];

  return (
    <S.Sidebar>
      <S.Logo>
        <TbSquareRoundedLetterCFilled />
      </S.Logo>

      <S.WelcomeText>Welcome,</S.WelcomeText>
      <S.UserName>CRAFTUI</S.UserName>

      <S.ChildRoutes>
        {childRoutes.map((route) => (
          <S.ChildRoute key={route.path} to={route.path}>
            <S.Icon>{route.icon}</S.Icon>
            {route.title}
          </S.ChildRoute>
        ))}
      </S.ChildRoutes>
    </S.Sidebar>
  );
};

export default ChildSideBar;