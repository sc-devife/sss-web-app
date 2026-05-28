import styled from "@emotion/styled";
import { screen } from "../../../styles/screen";

export const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 2rem);
    background: linear-gradient(135deg, #42A7C3, #5bbcd6);
    border-radius: 12px;
    padding: 1rem;
    ${screen.tablet} {
        padding: 1rem 1.5rem;
    }

    ${screen.desktop} {
        padding: 2rem 3rem;
    }
`;

export const MainCard = styled.div`
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    width: 90%;
    max-width: 350px;
    padding: 1.5rem 1rem 0 1rem;

    ${screen.tablet} {
        max-width: 420px;
        padding: 2rem 1.5rem 0 1.5rem;
    }

    ${screen.laptop} {
        max-width: 500px;
        padding: 2rem 2rem 0 2rem;
    }

    ${screen.desktop} {
        max-width: 600px;
    }
`;

export const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
`;

export const LogoStack = styled.div`
    position: relative;
    width: 3rem;
    height: 2rem;
`;

export const SmallLogoCard = styled.div`
    position: absolute;
    width: 2rem;
    height: 1.5rem;
    transform: rotate(-45deg);
    border-radius: 6px;
    top: 0;
`;

export const LogoTitle = styled.div`
    font-size: 1.2rem;
    font-weight: bold;
    color: #000;

    ${screen.tablet} {
        font-size: 1.4rem;
    }

    ${screen.laptop} {
        font-size: 1.8rem;
    }
`;

export const Title = styled.h1`
    font-size: 1.2rem;
    color: #fff;
    font-weight: 500;
    margin-top: 0.5rem;

    ${screen.tablet} {
        font-size: 1.2rem;
    }

    ${screen.laptop} {
        font-size: 1.4rem;
    }

    ${screen.desktop} {
        font-size: 1.6rem;
    }
`;

export const Picture = styled.img`
    width: 100%;
    max-width: 260px;
    border-radius: 8px;
    display: block;

    ${screen.tablet} {
        max-width: 250px;
    }

    ${screen.laptop} {
        max-width: 280px;
    }

    ${screen.desktop} {
        max-width: 290px;
    }
`;