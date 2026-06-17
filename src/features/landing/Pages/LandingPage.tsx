import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import * as S from "./landingStyle";
import { useNavigate } from "react-router-dom";
import { restoreUser } from "../../auth/authThunk";

const LandingPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    dispatch(restoreUser());
  }, [dispatch]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <S.Container>
      <S.Title>Landing Page</S.Title>
      <p>Welcome to the landing page!</p>
      <S.Button onClick={() => handleGetStarted()}>Get Started</S.Button>
    </S.Container>
  );
};

export default LandingPage;