import React, { useState } from "react";
import * as S from "./styles/addDestinationPopupStyle";
import { FaPlus } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { createEscapePoint } from "../features/library/Redux/escapePointsThunk";
import { useAppDispatch } from "../app/hooks";

interface AddDestinationPopupProps {
  onClose: () => void;
}

const AddDestinationPopup = ({ onClose }: AddDestinationPopupProps) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    city?: string;
    country?: string;
  }>({});
  const dispatch = useAppDispatch();
  const inputValidation = () => {
    const newErrors: { name?: string; city?: string; country?: string } = {};

    if (name.trim() === "") newErrors.name = "Name is required";
    if (city.trim() === "") newErrors.city = "City is required";
    if (country.trim() === "") newErrors.country = "Country is required";

    return newErrors;
  };

  const handleAddDestination = (e: React.FormEvent) => {
  e.preventDefault();

  const newErrors = inputValidation();

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setErrors({});

  const id = `${name}-${Math.floor(Math.random() * 10000)}`;

  dispatch(createEscapePoint({ id, name, city, country }));
  onClose();
};

  return (
    <S.Container>
      <S.Content onClick={(e) => e.stopPropagation()}>
        <S.Title>Add Destination</S.Title>

        <S.SubTitle>
          Add a new destination to create packages and track travel performance.
        </S.SubTitle>

        <hr />

        <S.Form onSubmit={handleAddDestination}>
          <S.FormGroup>
            <S.FormRow>
              <S.Field>
                <S.Label>Destination Name</S.Label>
                <S.Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <S.ErrorText>{errors.name}</S.ErrorText>
              </S.Field>

              <S.Field>
                <S.Label>City</S.Label>
                <S.Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <S.ErrorText>{errors.city}</S.ErrorText>
              </S.Field>
            </S.FormRow>

            <S.FormRow>
              <S.Field>
                <S.Label>Country</S.Label>
                <S.Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />

                <S.ErrorText>{errors.country}</S.ErrorText>
              </S.Field>

              <S.Field />
            </S.FormRow>
          </S.FormGroup>

          <S.ButtonContainer>
            <S.CancelButton type="button" onClick={onClose}>
              Cancel
            </S.CancelButton>

            <S.SubmitButton type="submit" >
              <FaPlus />
              Add Destination
            </S.SubmitButton>
          </S.ButtonContainer>
        </S.Form>
      </S.Content>
    </S.Container>
  );
};

export default AddDestinationPopup;
