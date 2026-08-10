import { ComingSoon } from "sss-web-app";
import { IoBarChartOutline, IoCardOutline } from "react-icons/io5";

export function Reports() {
  return <ComingSoon title="Reports" section="Reports" icon={IoBarChartOutline} />;
}

export function Billing() {
  return <ComingSoon title="Billing & invoices" section="Billing" icon={IoCardOutline} />;
}
