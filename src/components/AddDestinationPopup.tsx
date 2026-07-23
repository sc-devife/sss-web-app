import React, { useEffect, useId, useState } from "react";
import * as S from "./styles/addDestinationPopupStyle";
import { FaPlus, FaXmark } from "react-icons/fa6";
import { PiCurrencyDollar, PiMapPin } from "react-icons/pi";
import { createEscapePoint } from "../features/library/Redux/escapePointsThunk";
import { useAppDispatch } from "../app/hooks";
import { Country, State } from "country-state-city";
import SearchableDropdown from "./SearchableDropdown";

interface AddDestinationPopupProps {
  onClose: () => void;
}

const currencyOptions = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
];

const AddDestinationPopup = ({ onClose }: AddDestinationPopupProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    city?: string;
    country?: string;
    currency?: string;
  }>({});
  const dispatch = useAppDispatch();

  const countries = Country.getAllCountries();
  const countryOptions = countries.map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));
  const stateOptions = State.getStatesOfCountry(countryCode).map((state) => ({
    value: state.isoCode,
    label: state.name,
  }));

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const inputValidation = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Destination name is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!countryCode) newErrors.country = "Country is required";
    if (!currency) newErrors.currency = "Currency is required";
    return newErrors;
  };

  const handleAddDestination = (event: React.FormEvent) => {
    event.preventDefault();
    const newErrors = inputValidation();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const country = countries.find((item) => item.isoCode === countryCode)?.name ?? "";
    const state = stateOptions.find((item) => item.value === stateCode)?.label ?? "";
    const id = `${name}-${Math.floor(Math.random() * 10000)}`;

    dispatch(createEscapePoint({ id, name: name.trim(), city: city.trim(), country, countryCode, state, stateCode, currency }));
    onClose();
  };

  return (
    <S.Container onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <S.Content role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onMouseDown={(event) => event.stopPropagation()}>
        <S.Header>
          <S.HeaderIcon aria-hidden="true"><PiMapPin /></S.HeaderIcon>
          <S.HeaderCopy>
            <S.Title id={titleId}>Add destination</S.Title>
            <S.SubTitle id={descriptionId}>Create a destination for packages, bookings, and performance reporting.</S.SubTitle>
          </S.HeaderCopy>
          <S.CloseButton type="button" onClick={onClose} aria-label="Close add destination dialog"><FaXmark /></S.CloseButton>
        </S.Header>

        <S.Divider />

        <S.Form onSubmit={handleAddDestination} noValidate>
          <S.Section>
            <S.SectionHeading>Destination details</S.SectionHeading>
            <S.FormRow>
              <S.Field>
                <S.Label htmlFor="destination-name">Destination name <span>*</span></S.Label>
                <S.Input id="destination-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Bali Escape" autoFocus aria-invalid={Boolean(errors.name)} />
                <S.ErrorText>{errors.name}</S.ErrorText>
              </S.Field>
              <S.Field>
                <S.Label htmlFor="destination-city">City <span>*</span></S.Label>
                <S.Input id="destination-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Denpasar" aria-invalid={Boolean(errors.city)} />
                <S.ErrorText>{errors.city}</S.ErrorText>
              </S.Field>
            </S.FormRow>
          </S.Section>

          <S.Section>
            <S.SectionHeading>Location & currency</S.SectionHeading>
            <S.FormRow>
              <S.Field>
                <S.Label>Country <span>*</span></S.Label>
                <SearchableDropdown options={countryOptions} value={countryCode} onChange={(value) => { setCountryCode(value); setStateCode(""); }} placeholder="Select country" />
                <S.ErrorText>{errors.country}</S.ErrorText>
              </S.Field>
              <S.Field>
                <S.Label>State / Province</S.Label>
                <SearchableDropdown disabled={!countryCode} options={stateOptions} value={stateCode} onChange={setStateCode} placeholder={countryCode ? "Select state" : "Choose country first"} />
                <S.ErrorText />
              </S.Field>
            </S.FormRow>
            <S.CurrencyField>
              <S.Label htmlFor="destination-currency">Default currency <span>*</span></S.Label>
              <S.SelectWrap>
                <PiCurrencyDollar aria-hidden="true" />
                <S.Select id="destination-currency" value={currency} onChange={(event) => setCurrency(event.target.value)} aria-invalid={Boolean(errors.currency)}>
                  <option value="" disabled>Select currency</option>
                  {currencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </S.Select>
              </S.SelectWrap>
              <S.HelperText>Used as the default for quotes and package pricing.</S.HelperText>
              <S.ErrorText>{errors.currency}</S.ErrorText>
            </S.CurrencyField>
          </S.Section>

          <S.ButtonContainer>
            <S.CancelButton type="button" onClick={onClose}>Cancel</S.CancelButton>
            <S.SubmitButton type="submit"><FaPlus aria-hidden="true" />Add destination</S.SubmitButton>
          </S.ButtonContainer>
        </S.Form>
      </S.Content>
    </S.Container>
  );
};

export default AddDestinationPopup;
