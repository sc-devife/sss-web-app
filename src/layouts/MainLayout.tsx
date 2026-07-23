import React, { useState } from "react";
import styled from "@emotion/styled";
import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";
import Header from "./Header";

const MainLayoutContainer = styled.div`
  display: flex;
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
  background: #f0f0f3;
`;

const ContentWrapper = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MainContent = styled.main`
  min-width: 0;
  flex: 1;
  padding: 12px;
  overflow: auto;
  background: #f0f0f3;

  @media (min-width: 768px) { padding: 18px; }
`;

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <MainLayoutContainer>
      <SideBar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <ContentWrapper>
        <Header onMobileMenuClick={() => setMobileOpen(true)} />
        <MainContent><Outlet /></MainContent>
      </ContentWrapper>
    </MainLayoutContainer>
  );
};

export default MainLayout;
