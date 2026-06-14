import React, { useState } from "react";
import * as S from "../styles/DestinationsMangementStyle";
import TableData from "../../../components/TableData.json";
import GlobalTable from "../../../components/GlobalTable";
import { FaPlus } from "react-icons/fa6";
import AddDestinationPopup from "../../../components/AddDestinationPopup";

const DestinationsMangement = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

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
          Add Destination
        </S.AddDestinationButton>
      </S.TopBar>

      <S.CardContainer>
        <S.Card>
          <S.CardTitle>Total Destinations</S.CardTitle>
          <S.CardDescription>10</S.CardDescription>
        </S.Card>

        <S.Card>
          <S.CardTitle>Monthly Bookings</S.CardTitle>
          <S.CardDescription>5</S.CardDescription>
        </S.Card>

        <S.Card>
          <S.CardTitle>Revenue</S.CardTitle>
          <S.CardDescription>₹5,000</S.CardDescription>
        </S.Card>
      </S.CardContainer>

      <S.DestinationTable>
        <GlobalTable data={TableData} />
      </S.DestinationTable>

      {isPopupOpen && (
        <AddDestinationPopup onClose={handleClosePopup} />
      )}
    </S.Container>
  );
};

export default DestinationsMangement;