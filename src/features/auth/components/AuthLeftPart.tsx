import * as S from "./authLeftPartStyle";

const AuthLeftPart = () => {
  return (
    <S.Container>
      <S.MainCard>
        <S.LogoContainer>
          <S.LogoStack>
            <S.SmallLogoCard style={{ left: 0, zIndex: 1, backgroundColor: "#2EB9FF" }} />
<S.SmallLogoCard style={{ left: 12, backgroundColor: "#4A6DFF" }} />
          </S.LogoStack>
          <S.LogoTitle>Border</S.LogoTitle>
        </S.LogoContainer>
        <S.Title>
          Streamlining Travel Agency Data for Smarter, Faster Operations
        </S.Title>
        <S.Picture src="https://static.vecteezy.com/system/resources/thumbnails/065/585/780/small_2x/a-woman-exploring-a-new-destination-while-using-her-smartphone-to-capture-travel-memories-file-no-background-woman-traveling-and-using-a-smartphone-free-png.png" alt="Travel Data Visualization" />
      </S.MainCard>
    </S.Container>
  );
};

export default AuthLeftPart;
