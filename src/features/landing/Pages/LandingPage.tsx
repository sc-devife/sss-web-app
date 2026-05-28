import * as S from "./landingStyle";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();


  return (
    <S.Container>
      <S.Title>Landing Page</S.Title>
      <p>Welcome to the landing page!</p>
      <S.Button onClick={() => navigate("/login")}>Get Started</S.Button>
    </S.Container>
  );
};

export default LandingPage;