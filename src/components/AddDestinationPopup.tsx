import React from "react";
import * as S from "./styles/addDestinationPopupStyle";
import { FaPlus } from "react-icons/fa6";

interface AddDestinationPopupProps {
  onClose: () => void;
}

const AddDestinationPopup = ({
  onClose,
}: AddDestinationPopupProps) => {
  return (
    <S.Container>
       <S.Content onClick={(e) => e.stopPropagation()}>
        <S.Title>Add Destination</S.Title>

        <S.SubTitle>
          Add a new destination to create packages and track travel performance.
        </S.SubTitle>

        <hr />

        <S.Form>
          <S.FormGroup>
            <div><S.Label>Destination Name</S.Label>
          <S.Input placeholder="Destination Name" /></div>
          <div><S.Label>Description</S.Label>
          <S.Input placeholder="Description" /></div>
          </S.FormGroup>

          <S.ButtonContainer>
            <S.CancelButton
              type="button"
              onClick={onClose}
            >
              Cancel
            </S.CancelButton>

            <S.SubmitButton type="submit">
              <FaPlus />Add Destination
            </S.SubmitButton>
          </S.ButtonContainer>
        </S.Form>
      </S.Content>
    </S.Container>
  );
};

export default AddDestinationPopup;