import { EmptyState } from "sss-web-app";
import { IoPeopleOutline, IoDocumentTextOutline } from "react-icons/io5";

export function NoLeads() {
  return (
    <EmptyState
      icon={IoPeopleOutline}
      title="No leads yet"
      description="Leads from your website, email, and referrals will show up here once they start coming in."
      action={{ label: "Add a lead", onClick: () => {} }}
    />
  );
}

export function NoQuotes() {
  return (
    <EmptyState
      icon={IoDocumentTextOutline}
      title="No quotes for this escape"
      description="Create a quote to send pricing and itinerary details to the traveller."
    />
  );
}
