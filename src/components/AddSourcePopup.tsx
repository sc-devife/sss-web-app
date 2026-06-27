import React, { useState } from "react";
import * as S from "./styles/addSourcePopupStyle";
import { FaPlus } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { createEscapePoint } from "../features/library/Redux/escapePointsThunk";
import { useAppDispatch } from "../app/hooks";
import { Country, State } from "country-state-city";
import SearchableDropdown from "./SearchableDropdown";
import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaWhatsapp,
  FaGlobe,
  FaCheck,
} from "react-icons/fa";

import { SiGoogleads } from "react-icons/si";

interface AddSourcePopupProps {
  onClose: () => void;
}

const AddSourcePopup = ({ onClose }: AddSourcePopupProps) => {
  const [selectedSource, setSelectedSource] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [errors, setErrors] = useState<{
    sourceName?: string;
    sourceLink?: string;
  }>({});
  const dispatch = useAppDispatch();

  const inputValidation = () => {
    const newErrors: { sourceName?: string; sourceLink?: string } = {};

    if (selectedSource === "")
      newErrors.sourceName = "Select a Source Type";
    else if (sourceName.trim() === "")
      newErrors.sourceName = "Source Name is required";
    if (sourceLink.trim() === "")
      newErrors.sourceLink = "Source Link is required";

    return newErrors;
  };

  const isCustomSource = selectedSource === "Custom Source";
  const isSourceSelected = selectedSource !== "";

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = inputValidation();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    console.log(sourceName, sourceLink, selectedSource);

    dispatch(createEscapePoint({ sourceName, sourceLink }));
    onClose();
  };

  const Source = [
    {
      id: 1,
      icon: FaGlobe,
      name: "Website",
    },
    {
      id: 2,
      icon: FaLinkedin,
      name: "Linkedin",
    },
    {
      id: 3,
      icon: FaInstagram,
      name: "Instagram",
    },
    {
      id: 4,
      icon: FaFacebook,
      name: "Facebook",
    },
    {
      id: 5,
      icon: FaYoutube,
      name: "Youtube",
    },
    {
      id: 6,
      icon: FaWhatsapp,
      name: "Whatsapp",
    },
    {
      id: 7,
      icon: SiGoogleads,
      name: "Google Ads",
    },
    {
      id: 8,
      icon: FaPlus,
      name: "Custom Source",
    },
  ];

  return (
    <S.Container>
      <S.Content onClick={(e) => e.stopPropagation()}>
        <S.Title>Add Source</S.Title>

        <S.SubTitle>Connect and track lead acquisition channels.</S.SubTitle>

        <hr />

        <S.Form onSubmit={handleAddSource}>
          <S.SourceTypeContainer>
            <S.ContainerLabel>Choose Source Type</S.ContainerLabel>
            <S.SourceType>
              {Source.map((item) => (
                <S.SourceItem
                  key={item.id}
                  $selected={selectedSource === item.name}
                  onClick={() => {
                    setSelectedSource(item.name);

                    if (item.name !== "Custom Source") {
                      setSourceName(item.name);
                    } else {
                      setSourceName("");
                    }
                  }}
                >
                  {selectedSource === item.name && (
                    <S.CheckMark>
                      <FaCheck />
                    </S.CheckMark>
                  )}

                  <S.SourceIcon>
                    <item.icon />
                  </S.SourceIcon>

                  <S.SourceName>{item.name}</S.SourceName>
                </S.SourceItem>
              ))}
            </S.SourceType>
          </S.SourceTypeContainer>

          <S.SourceTypeContainer>
              <S.ContainerLabel>Source Details</S.ContainerLabel>
              <S.FormRow>
                <S.Field>
                  <S.Label>Source Name</S.Label>
                  <S.Input
                    type="text"
                    disabled={!isCustomSource}
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="Enter Source Name"
                  />
                  <S.ErrorText>{errors.sourceName}</S.ErrorText>
                </S.Field>

                <S.Field>
                  <S.Label>Source Link</S.Label>
                  <S.Input
                    value={sourceLink}
                    onChange={(e) => setSourceLink(e.target.value)}
                    placeholder="Enter Source Link"
                  />
                  <S.ErrorText>{errors.sourceLink}</S.ErrorText>
                </S.Field>
              </S.FormRow>
            
          </S.SourceTypeContainer>

          <S.ButtonContainer>
            <S.CancelButton type="button" onClick={onClose}>
              Cancel
            </S.CancelButton>

            <S.SubmitButton type="submit">
              <FaPlus />
              Add Source
            </S.SubmitButton>
          </S.ButtonContainer>
        </S.Form>
      </S.Content>
    </S.Container>
  );
};

export default AddSourcePopup;
