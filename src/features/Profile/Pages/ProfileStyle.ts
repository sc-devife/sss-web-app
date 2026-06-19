import styled from "@emotion/styled";
import { screen } from "../../../styles/screen";

export const Container = styled.div`
  justify-content: center;
  min-height: calc(100vh - 4.5rem);
  width: 100%;
  display: flex;
  justify-content: center;
`;

export const ProfileCard = styled.div`
  width: 100%;
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

export const ProfileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-direction: column;

  ${screen.sm} {
    flex-direction: row;
  }
`;

export const ProfileImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e5e7eb;

  ${screen.sm} {
    width: 100px;
    height: 100px;
  }
`;


export const UserName = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;

  ${screen.sm} {
    font-size: 1.8rem;
  }
`;

export const Role = styled.p`
  color: #64748b;
  font-size: 0.95rem;
  margin-top: 0.1rem;
`;

export const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const ProfileDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

export const Field = styled.div`
  background: #f8fafc;
  padding: 1rem;
  border-radius: 10px;
`;

export const Label = styled.div`
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.3rem;
`;

export const Value = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
`;

export const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: #D6FB4B;
  color: #000;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;
