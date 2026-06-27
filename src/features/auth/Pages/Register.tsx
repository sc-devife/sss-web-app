import React, { useState } from "react";
import * as S from "./loginStyle";
import { IoLockClosedOutline, IoMailOutline } from "react-icons/io5";
import { FaEye, FaEyeSlash, FaRegUser, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../authThunk";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../app/store";
import AppToast from "../../../services/toastService";
import { IoMdPhoneLandscape } from "react-icons/io";
import { FiPhone } from "react-icons/fi";
import { useAppSelector } from "../../../app/hooks";
import Spinner from "../../../components/Spinner";
import { RiUserSearchLine } from "react-icons/ri";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const { signupLoading} = useAppSelector((state) => state.auth);
  const [errors, setErrors] = useState<{
    email?: string;
    userId?: string;
    password?: string;
    phone?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
  }>({});

  const inputValidation = () => {
    const newErrors: {
      email?: string;
      userId?: string;
      password?: string;
      phone?: string;
      confirmPassword?: string;
      firstName?: string;
      lastName?: string;
    } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    const userIdRegex = /^[a-zA-Z0-9._]{3,30}$/;

    if (!firstName || firstName.trim() === "") {
      newErrors.firstName = "First Name is Required";
    }

    // Email validation
    if (!email || email.trim() === "") {
      newErrors.email = "Email is Required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!userId || userId.trim() === "") {
      newErrors.userId = "User ID is Required";
    } else if (!userIdRegex.test(userId)) {
      newErrors.userId = "User ID must be 3-30 characters long and contain only letters, numbers, dots, or underscores";
    }

    if (!phone || phone.trim() === "") {
      newErrors.phone = "Phone Number is Required";
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number.";
    }

    // Password validation
    if (!password || password.trim() === "") {
      newErrors.password = "Password is Required";
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "Password must be atleast 6 characters including uppercase, lowercase, number & special character.";
    }

    // Confirm Password validation
    if (!confirmPassword || confirmPassword.trim() === "") {
      newErrors.confirmPassword = "Confirm Password is Required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const data = {
    firstName,
    lastName,
    name: firstName + " " + lastName,
    mobileNumber: phone,
    email,
    userId,
    password,
    profilePic,
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputValidation()) {
      try {
        const res = await dispatch(signupUser(data)).unwrap();
        console.log("Signup successful:", res);
        AppToast.showSuccess("Signup successful!");
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Signup failed:", error);
        AppToast.showError(error as string);
      }
    }
  };
  return (
    <S.Container>
      <S.RightPart>
        <S.RightPartMainCard>
          <S.RightPartLogo
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHB7m2IeYeQuefiQ3f3LIKCWO4wX7hQ7ZRbQ&s"
            alt="Logo"
          />
          <S.PageTitle>Create Account</S.PageTitle>
          <S.PageSubTitle>Sign up to access your workspace.</S.PageSubTitle>
          <S.LoginForm onSubmit={handleSignup}>

            {/* Form fields */}
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ width: "48%" }}>
                <div style={{ width: "100%", textAlign: "left" }}>
                  <S.Label>First Name</S.Label>
                </div>
                <S.InputWrapper
                  style={{
                    marginTop: "0.2rem",
                    marginBottom: errors.email ? "0.2rem" : "0.2rem",
                  }}
                >
                  <S.Input
                    type="text"
                    placeholder=" "
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <S.IconLeft>
                <FaRegUser />
              </S.IconLeft>
                </S.InputWrapper>
              </div>
              <div style={{ width: "48%" }}>
                <div style={{ width: "100%", textAlign: "left" }}>
                  <S.Label>Last Name</S.Label>
                </div>
                <S.InputWrapper
                  style={{
                    marginTop: "0.2rem",
                    marginBottom: errors.email ? "0.2rem" : "0.2rem",
                  }}
                >
                  <S.Input
                    type="text"
                    placeholder=" "
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <S.IconLeft>
                <FaRegUser />
              </S.IconLeft>
                </S.InputWrapper>
              </div>
            </div>
            {errors.firstName && <S.Error>{errors.firstName}</S.Error>}

            <div style={{ width: "100%", textAlign: "left", marginTop: "0.2rem" }}>
              <S.Label>User ID</S.Label>
            </div>
            <S.InputWrapper
              style={{
                marginTop: "0.2rem",
                marginBottom: errors.email ? "0.2rem" : "0.2rem",
              }}
            >
              <S.Input
                type="text"
                placeholder=" "
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <S.IconLeft>
                <RiUserSearchLine />
              </S.IconLeft>
            </S.InputWrapper>
            {errors.userId && <S.Error>{errors.userId}</S.Error>}

            <div style={{ width: "100%", textAlign: "left", marginTop: "0.2rem" }}>
              <S.Label>Email Address</S.Label>
            </div>
            <S.InputWrapper
              style={{
                marginTop: "0.2rem",
                marginBottom: errors.email ? "0.2rem" : "0.2rem",
              }}
            >
              <S.Input
                type="text"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <S.IconLeft>
                <IoMailOutline />
              </S.IconLeft>
            </S.InputWrapper>
            {errors.email && <S.Error>{errors.email}</S.Error>}

            <div
              style={{ width: "100%", textAlign: "left", marginTop: "0.2rem" }}
            >
              <S.Label>Phone Number</S.Label>
            </div>
            <S.InputWrapper
              style={{
                marginTop: "0.2rem",
                marginBottom: errors.phone ? "0.2rem" : "0.2rem",
              }}
            >
              <S.Input
                type="text"
                placeholder=" "
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <S.IconLeft>
                <FiPhone />
              </S.IconLeft>
            </S.InputWrapper>
            {errors.phone && <S.Error>{errors.phone}</S.Error>}

            <div
              style={{
                width: "100%",
                textAlign: "left",
                marginTop: errors.phone ? "0.2rem" : "0.2rem",
              }}
            >
              <S.Label>Password</S.Label>
            </div>
            <S.InputWrapper
              style={{
                marginTop: "0.2rem",
                marginBottom: errors.password ? "0.2rem" : "0.2rem",
              }}
            >
              <S.Input
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <S.IconLeft>
                <IoLockClosedOutline />
              </S.IconLeft>

              <S.IconRight onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </S.IconRight>
            </S.InputWrapper>
            {errors.password && <S.Error>{errors.password}</S.Error>}

            <div
              style={{
                width: "100%",
                textAlign: "left",
                marginTop: errors.password ? "0.2rem" : "0.2rem",
              }}
            >
              <S.Label>Confirm Password</S.Label>
            </div>
            <S.InputWrapper
              style={{
                marginTop: "0.2rem",
                marginBottom: "0.2rem",
              }}
            >
              <S.Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <S.IconLeft>
                <IoLockClosedOutline />
              </S.IconLeft>

              <S.IconRight
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </S.IconRight>
            </S.InputWrapper>
            {errors.confirmPassword && (
              <S.Error>{errors.confirmPassword}</S.Error>
            )}

            <div
              style={{
                width: "100%",
                textAlign: "left",
                marginTop: "0.2rem",
              }}
            >
              <S.Label>Profile Picture</S.Label>
            </div>

            <S.InputWrapper
              style={{
                marginTop: "0.2rem",
                marginBottom: "0.2rem",
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                alignItems: "center",
              }}
            >
                {/* Profile pic view & upload */}
                <S.ProfilePicture
                  src={
                    profilePic
                      ? URL.createObjectURL(profilePic)
                      : "https://static.vecteezy.com/system/resources/thumbnails/032/176/191/small_2x/business-avatar-profile-black-icon-man-of-user-symbol-in-trendy-flat-style-isolated-on-male-profile-people-diverse-face-for-social-network-or-web-vector.jpg"
                  }
                  alt="Profile Picture"
                />
              <S.Input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => setProfilePic(e.target.files![0])}
              />
            </S.InputWrapper>

            <S.Button type="submit">
              {signupLoading ? <Spinner /> : "Sign Up"}
            </S.Button>
          </S.LoginForm>
        </S.RightPartMainCard>
      </S.RightPart>
      <span
        style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.7rem" }}
      >
        © {new Date().getFullYear()} untitled UI Travel Operations. All rights
        reserved.
      </span>
    </S.Container>
  );
};

export default Register;
