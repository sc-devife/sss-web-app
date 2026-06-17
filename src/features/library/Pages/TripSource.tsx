import React, { useEffect, useState } from "react";
import * as S from "../styles/DestinationsMangementStyle";
import GlobalTable from "../../../components/GlobalTable";
import { FaPlus } from "react-icons/fa6";
import AddDestinationPopup from "../../../components/AddDestinationPopup";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import TableData from "../../../components/TableData.json"

const TripSource = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const dispatch = useAppDispatch();


  const handleAddDestination = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <S.Container>
      <S.TopBar>
        <S.AddDestinationButton onClick={handleAddDestination}>
          <FaPlus />
          Add Source
        </S.AddDestinationButton>
      </S.TopBar>

      <S.CardContainer>
        <S.Card>
          <S.CardTitle>Total Leads</S.CardTitle>
          <S.CardDescription>12.8 K</S.CardDescription>
        </S.Card>

        <S.Card>
          <S.CardTitle>Best Performing Source</S.CardTitle>
          <S.CardDescription>Instagram</S.CardDescription>
        </S.Card>

        <S.Card>
          <S.CardTitle>Revenue</S.CardTitle>
          <S.CardDescription>₹8.4 Cr</S.CardDescription>
        </S.Card>
      </S.CardContainer>

      <S.DestinationTable>
        <GlobalTable data={TableData} />
      </S.DestinationTable>

      {isPopupOpen && <AddDestinationPopup onClose={handleClosePopup} />}
    </S.Container>
  );
};

export default TripSource;
