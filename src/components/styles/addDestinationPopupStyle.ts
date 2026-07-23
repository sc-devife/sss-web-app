import styled from "@emotion/styled";
import { screen } from "../../styles/screen";

const ink = "#17211b";
const muted = "#667085";
const line = "#d8ded9";
const accent = "#d6fb4b";

export const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(23, 33, 27, 0.58);
  backdrop-filter: blur(5px);
`;

export const Content = styled.div`
  width: min(680px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 24px;
  color: ${ink};
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(23, 33, 27, 0.25);

  ${screen.tablet} {
    padding: 28px;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

export const HeaderIcon = styled.div`
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  color: ${ink};
  background: ${accent};
  border-radius: 12px;
  font-size: 22px;
`;

export const HeaderCopy = styled.div`
  min-width: 0;
  flex: 1;
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

export const SubTitle = styled.p`
  max-width: 500px;
  margin: 4px 0 0;
  color: ${muted};
  font-size: 14px;
  line-height: 1.5;
`;

export const CloseButton = styled.button`
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: ${muted};
  background: #f4f6f4;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  transition: background 160ms ease, color 160ms ease;

  &:hover { color: ${ink}; background: #e9edea; }
  &:focus-visible { outline: 3px solid rgba(170, 207, 37, 0.35); }
`;

export const Divider = styled.div`
  height: 1px;
  margin: 22px 0;
  background: ${line};
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SectionHeading = styled.h3`
  margin: 0;
  color: ${ink};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

export const FormGroup = styled.div``;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  ${screen.tablet} { grid-template-columns: 1fr 1fr; }
`;

export const Field = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

export const CurrencyField = styled(Field)`
  ${screen.tablet} { width: calc(50% - 7px); }
`;

export const Label = styled.label`
  color: ${ink};
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  span { color: #b42318; }
`;

export const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 13px;
  color: ${ink};
  background: #ffffff;
  border: 1px solid ${line};
  border-radius: 10px;
  outline: none;
  font: inherit;
  font-size: 14px;
  transition: border-color 160ms ease, box-shadow 160ms ease;

  &::placeholder { color: #98a29b; }
  &:hover { border-color: #aeb8b1; }
  &:focus { border-color: #8faa24; box-shadow: 0 0 0 3px rgba(214, 251, 75, 0.28); }
  &[aria-invalid="true"] { border-color: #b42318; }
`;

export const SelectWrap = styled.div`
  position: relative;
  color: ${muted};
  > svg { position: absolute; top: 50%; left: 13px; z-index: 1; transform: translateY(-50%); font-size: 19px; pointer-events: none; }
`;

export const Select = styled.select`
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 36px 0 40px;
  color: ${ink};
  background: #ffffff;
  border: 1px solid ${line};
  border-radius: 10px;
  outline: none;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  &:focus { border-color: #8faa24; box-shadow: 0 0 0 3px rgba(214, 251, 75, 0.28); }
  &[aria-invalid="true"] { border-color: #b42318; }
`;

export const HelperText = styled.p`
  margin: -2px 0 0;
  color: ${muted};
  font-size: 12px;
  line-height: 1.4;
`;

export const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid ${line};
  border-radius: 10px;
  resize: vertical;
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
  padding-top: 2px;

  ${screen.tablet} { flex-direction: row; justify-content: flex-end; }
`;

const ActionButton = styled.button`
  min-height: 42px;
  padding: 0 18px;
  border-radius: 10px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease;
  &:active { transform: translateY(1px); }
  &:focus-visible { outline: 3px solid rgba(170, 207, 37, 0.35); outline-offset: 2px; }
`;

export const CancelButton = styled(ActionButton)`
  color: ${ink};
  background: #ffffff;
  border: 1px solid ${line};
  &:hover { background: #f4f6f4; }
`;

export const SubmitButton = styled(ActionButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${ink};
  background: ${accent};
  border: 1px solid ${accent};
  &:hover { background: #c7ec3d; }
`;

export const ErrorText = styled.p`
  min-height: 16px;
  margin: -3px 0 0;
  color: #b42318;
  font-size: 12px;
  line-height: 1.3;
`;
