import React from "react";
import {
  LiaTachometerAltSolid,
  LiaUserSolid,
  LiaCogSolid,
} from "react-icons/lia";
import { TbSquareRoundedLetterCFilled } from "react-icons/tb";
import * as S from "./sideBarIconsStyle";
import ProtectedRouter from "../routes/ProtectedRouter";

const SideBarIcons: React.FC = () => {
  const icons = ProtectedRouter.map((route) => ({
    path: route.path,
    name: route.title,
    icon: route.icon,
  }));

  return (
    <S.Sidebar>
      {/* Logo */}
      <S.Logo>
        <TbSquareRoundedLetterCFilled />
      </S.Logo>

      {/* Menu Icons*/}
      <S.Menu>
        {icons.map((item) => (
          <div key={item.path} title={item.name}>
            <S.StyledNavLink to={item.path}>
              <S.Icon>{item.icon}</S.Icon>
            </S.StyledNavLink>
          </div>
        ))}
      </S.Menu>
    </S.Sidebar>
  );
};

export default SideBarIcons;