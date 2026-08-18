import { getDealByUid } from "@/lib/deals";
import { getQuoteByUid } from "@/lib/quotes";
import { getItineraryByUid } from "@/lib/itineraries";
import { getEscapeById } from "@/lib/escapes";
import { getMilestonesForDeal } from "@/lib/payment-milestones";
import { getMyOrganization } from "@/lib/organization";
import { getInvoiceTemplates } from "@/lib/invoice-templates";
import { resolveFileUrl } from "@/lib/files";
import { formatDisplayDate } from "@/lib/date";
import { PrintButton } from "@/components/quotes/PrintButton";

export default async function InvoicePreviewPage({ params }: { params: { uid: string } }) {
  const deal = await getDealByUid(params.uid);
  const quote = await getQuoteByUid(deal.acceptedQuoteUid);
  const itinerary = await getItineraryByUid(quote.itineraryUid);
  const [trip, milestones, organization, templates] = await Promise.all([
    getEscapeById(itinerary.escapeUid),
    getMilestonesForDeal(deal.uid),
    getMyOrganization(),
    getInvoiceTemplates(),
  ]);

  const template = templates.find((t) => t.id === organization.invoice_template_id) ?? templates[0];

  const totalPaid = milestones.reduce((sum, m) => sum + m.amountPaidUsd, 0);
  const totalDue = milestones.reduce((sum, m) => sum + m.amountUsd, 0);
  const totalOutstanding = totalDue - totalPaid;

  return (
    <div className="min-h-screen bg-white text-black">
      <style>{`@media print { footer { display: none !important; } }`}</style>
      <PrintButton />

      <div className="mx-auto max-w-3xl px-8 py-12 print:px-0 print:py-0">
        <div className="mb-8 flex items-center justify-between border-b pb-6" style={{ borderColor: template.accentColor }}>
          <div className="flex items-center gap-4">
            {organization.logo_file && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveFileUrl(organization.logo_file)} alt={organization.display_name} className="h-12 w-auto" />
            )}
            <div>
              <p className="text-2xl font-bold" style={{ color: template.accentColor }}>
                {organization.display_name}
              </p>
              <p className="text-sm text-gray-500">Invoice</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Invoice for Deal #{deal.uid.slice(0, 8)}</p>
            <p>Quote v{quote.version}</p>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-xl font-semibold" style={{ color: template.accentColor }}>
            {trip.lead?.name ?? `Escape #${trip.uid}`}
          </h1>
          <p className="text-sm text-gray-600">
            {trip.escapePoints.map((d) => d.name).join(", ")}
            {trip.startDate && ` · ${formatDisplayDate(trip.startDate)}`}
            {trip.numberOfDays && ` · ${trip.numberOfDays} days`}
          </p>
        </div>

        <div className="mb-8 rounded border border-gray-200 p-4 text-sm">
          <div className="flex justify-between border-b pb-2 text-base font-bold" style={{ borderColor: template.accentColor }}>
            <span>Total booking value</span>
            <span>{quote.totalUsd != null ? `$${quote.totalUsd.toFixed(2)}` : "—"} USD</span>
          </div>
        </div>

        <div className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: template.accentColor }}>
          Payment milestones
        </div>
        <div className="mb-8 flex flex-col gap-2">
          {milestones.map((m) => (
            <div key={m.uid} className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm">
              <div>
                <p className="font-medium">{m.label}</p>
                <p className="text-gray-500">Due {formatDisplayDate(m.dueDate)}</p>
              </div>
              <div className="text-right">
                <p className="capitalize text-gray-500">{m.status.replace("_", " ")}</p>
                <p>${m.amountPaidUsd.toFixed(2)} / ${m.amountUsd.toFixed(2)} USD</p>
              </div>
            </div>
          ))}
          {milestones.length === 0 && <p className="text-sm text-gray-500">No payment milestones recorded yet.</p>}
        </div>

        <div className="rounded border border-gray-200 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Total paid</span>
            <span>${totalPaid.toFixed(2)} USD</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold" style={{ borderColor: template.accentColor }}>
            <span>Balance outstanding</span>
            <span>${totalOutstanding.toFixed(2)} USD</span>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Please refer to your travel consultant for questions about this invoice or upcoming payment due dates.
        </p>
      </div>
    </div>
  );
}
