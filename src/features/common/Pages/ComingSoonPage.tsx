import styled from "@emotion/styled";
import type { IconType } from "react-icons";
import { FiArrowUpRight } from "react-icons/fi";

interface ComingSoonPageProps {
  title: string;
  section: string;
  icon: IconType;
}

const Page = styled.section`
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Card = styled.div`
  width: min(100%, 680px);
  padding: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);

  @media (max-width: 640px) {
    padding: 24px;
  }
`;

const IconBox = styled.div`
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: #17210b;
  background: #e7f0c2;
  font-size: 25px;
`;

const Eyebrow = styled.p`
  margin: 24px 0 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  color: #17210b;
  font-size: clamp(28px, 5vw, 42px);
  line-height: 1.15;
`;

const Description = styled.p`
  max-width: 520px;
  margin: 16px 0 28px;
  color: #64748b;
  font-size: 16px;
  line-height: 1.6;
`;

const Status = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 999px;
  background: #f4f6ef;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
`;

const ComingSoonPage = ({ title, section, icon: Icon }: ComingSoonPageProps) => (
  <Page aria-labelledby="page-title">
    <Card>
      <IconBox aria-hidden="true"><Icon /></IconBox>
      <Eyebrow>{section}</Eyebrow>
      <Title id="page-title">{title}</Title>
      <Description>
        This workspace is connected and ready for the next implementation step. Add your workflows, data, and team permissions here.
      </Description>
      <Status><FiArrowUpRight aria-hidden="true" /> Ready to configure</Status>
    </Card>
  </Page>
);

export default ComingSoonPage;
