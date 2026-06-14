import React from "react";
import styled from "@emotion/styled";
import SideBar from "./SideBar";
import { Outlet } from "react-router-dom";
import Header from "./Header";

const MainLayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden; /* Prevent page scrolling */
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; /* Important for horizontal overflow */
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 10px;
  overflow: auto; /* Handles both x and y scrolling */
  background-color: #f0f0f3;
  min-width: 0;
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