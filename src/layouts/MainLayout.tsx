import React from "react";
import styled from "@emotion/styled";
import SideBar from "./SideBar";
import { Outlet } from "react-router-dom";
import Header from "./Header";

const MainLayoutContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #F0F0F3;
`;

const MainLayout: React.FC = () => {
  return (
    <MainLayoutContainer>
      <SideBar />

      <ContentWrapper>
        <Header />
        <MainContent>
          <Outlet />
        </MainContent>
      </ContentWrapper>
    </MainLayoutContainer>
  );
};

export default MainLayout;