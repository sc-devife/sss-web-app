import React from "react";
import * as S from "./ProfileStyle";
import { FaEdit, FaUser } from "react-icons/fa";
import { FaRegCircleUser } from "react-icons/fa6";

function Profile() {
  const user = {
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@example.com",
    mobile: "+91 9876543210",
    role: "Admin",
    location: "Bangalore, India",
    profilePic: "https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg?w=1200&h=992&fl=progressive&q=70&fm=jpg",
  };

  return (
    <S.Container>
      <S.ProfileCard>
        <S.ProfileHeader>
          <S.ProfileInfo>
            {user.profilePic ? (
              <S.ProfileImage src={user.profilePic} alt="Profile" />
            ) : (
              <S.ProfileImage as={FaUser} alt="Profile" />
            )}

            <div>
              <S.UserName>
                {user.firstName} {user.lastName}
              </S.UserName>
              <S.Role>{user.role}</S.Role>
            </div>
          </S.ProfileInfo>

          <S.EditButton title="Edit Profile">
            <FaEdit />
            Edit Profile
          </S.EditButton>
        </S.ProfileHeader>

        <S.ProfileDetails>
          <S.Field>
            <S.Label>First Name</S.Label>
            <S.Value>{user.firstName}</S.Value>
          </S.Field>

          <S.Field>
            <S.Label>Last Name</S.Label>
            <S.Value>{user.lastName}</S.Value>
          </S.Field>

          <S.Field>
            <S.Label>Email</S.Label>
            <S.Value>{user.email}</S.Value>
          </S.Field>

          <S.Field>
            <S.Label>Mobile Number</S.Label>
            <S.Value>{user.mobile}</S.Value>
          </S.Field>
        </S.ProfileDetails>
      </S.ProfileCard>
    </S.Container>
  );
}

export default Profile;
