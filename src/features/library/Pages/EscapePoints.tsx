import React, { useEffect, useState } from "react";
import * as S from "../styles/DestinationsMangementStyle";
import GlobalTable from "../../../components/GlobalTable";
import { FaPlus } from "react-icons/fa6";
import AddDestinationPopup from "../../../components/AddDestinationPopup";
import { getAllEscapePoints } from "../Redux/escapePointsThunk";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";

const DestinationsMangement = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const dispatch = useAppDispatch();
  const {
    getAllEscapePointsData,
    getAllEscapePointsLoading,
    getAllEscapePointsError,
  } = useAppSelector((state) => state.escapePoints);

  const handleAddDestination = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  useEffect(() => {
    dispatch(getAllEscapePoints());
  }, [dispatch]);

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
        <GlobalTable data={getAllEscapePointsData} />
      </S.DestinationTable>

      {isPopupOpen && <AddDestinationPopup onClose={handleClosePopup} />}
    </S.Container>
  );
};

export default DestinationsMangement;
