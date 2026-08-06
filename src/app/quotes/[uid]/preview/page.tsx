import { getQuoteByUid } from "@/lib/quotes";
import { getItineraryByUid } from "@/lib/itineraries";
import { getItemsForItinerary } from "@/lib/itinerary-items";
import { getItineraryContentItems } from "@/lib/itinerary-content-items";
import { getEscapeById } from "@/lib/escapes";
import { getMyOrganization } from "@/lib/organization";
import { getQuoteTemplates } from "@/lib/quote-templates";
import { resolveFileUrl } from "@/lib/files";
import { PrintButton } from "@/components/quotes/PrintButton";

export default async function QuotePreviewPage({ params }: { params: { uid: string } }) {
  const quote = await getQuoteByUid(params.uid);
  const itinerary = await getItineraryByUid(quote.itineraryUid);
  const [items, contentItems, trip, organization, templates] = await Promise.all([
    getItemsForItinerary(itinerary.uid),
    getItineraryContentItems(itinerary.uid),
    getEscapeById(itinerary.escapeId),
    getMyOrganization(),
    getQuoteTemplates(),
  ]);

  const inclusions = contentItems.filter((c) => c.type === "INCLUSION");
  const exclusions = contentItems.filter((c) => c.type === "EXCLUSION");
  const terms = contentItems.filter((c) => c.type === "TERMS");

  const template =
    templates.find((t) => t.id === quote.templateId) ??
    templates.find((t) => t.id === organization.quote_template_id) ??
    templates[0];

  const itemsByDay = items.reduce<Record<number, typeof items>>((acc, item) => {
    (acc[item.dayNumber] ??= []).push(item);
    return acc;
  }, {});

  const isModern = template.layoutFamily === "modern";
  const isMinimal = template.layoutFamily === "minimal";

  return (
    <div className="min-h-screen bg-white text-black">
      <style>{`@media print { footer { display: none !important; } }`}</style>
      <PrintButton />

      <div className="mx-auto max-w-3xl px-8 py-12 print:px-0 print:py-0">
        <div
          className={isModern ? "mb-8 rounded-[12px] p-8 text-white" : "mb-8 flex items-center justify-between border-b pb-6"}
          style={isModern ? { backgroundColor: template.accentColor } : { borderColor: template.accentColor }}
        >
          <div className="flex items-center gap-4">
            {organization.logo_file && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveFileUrl(organization.logo_file)} alt={organization.display_name} className="h-12 w-auto" />
            )}
            <div>
              <p className={isModern ? "text-2xl font-bold" : "text-2xl font-bold"} style={!isModern ? { color: template.accentColor } : undefined}>
                {organization.display_name}
              </p>
              {!isMinimal && <p className={isModern ? "text-sm opacity-80" : "text-sm text-gray-500"}>Travel Quote</p>}
            </div>
          </div>
          <div className={isModern ? "text-right text-sm opacity-90" : "text-right text-sm text-gray-500"}>
            <p>Quote v{quote.version}</p>
            {quote.validUntil && <p>Valid until {quote.validUntil}</p>}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-xl font-semibold" style={{ color: isModern ? undefined : template.accentColor }}>
            {itinerary.name}
          </h1>
          <p className="text-sm text-gray-600">
            {trip.escapePoints.map((d) => d.name).join(", ")}
            {trip.startDate && ` · ${trip.startDate}`}
            {trip.numberOfDays && ` · ${trip.numberOfDays} days`}
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4">
          {Object.entries(itemsByDay)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, dayItems]) => (
              <div key={day}>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wide" style={{ color: template.accentColor }}>
                  Day {day}
                </p>
                <ul className={isMinimal ? "flex flex-col gap-0.5 text-sm" : "flex flex-col gap-1 rounded border border-gray-200 p-3 text-sm"}>
                  {dayItems
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((item) => (
                      <li key={item.uid} className="flex justify-between">
                        <span className="capitalize text-gray-500">{item.itemType}</span>
                        <span>{item.referenceLabel}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          {items.length === 0 && <p className="text-sm text-gray-500">No itinerary items added yet.</p>}
        </div>

        <div className={isMinimal ? "border-t pt-4 text-sm" : "rounded border border-gray-200 p-4 text-sm"}>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Subtotal</span>
            <span>{quote.subtotalUsd != null ? `$${quote.subtotalUsd.toFixed(2)}` : "—"} USD</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Tax</span>
            <span>{quote.taxAmountUsd != null ? `$${quote.taxAmountUsd.toFixed(2)}` : "—"} USD</span>
          </div>
          {quote.discountType !== "none" && (
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Discount ({quote.discountType})</span>
              <span>{quote.discountValue ?? "—"}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold" style={{ borderColor: template.accentColor }}>
            <span>Total</span>
            <span>{quote.totalUsd != null ? `$${quote.totalUsd.toFixed(2)}` : "—"} USD</span>
          </div>
          {quote.currencyCode && quote.currencyCode !== "USD" && quote.fxRateSnapshot && quote.totalUsd != null && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Approx. in {quote.currencyCode}</span>
              <span>{(quote.totalUsd * quote.fxRateSnapshot).toFixed(2)} {quote.currencyCode}</span>
            </div>
          )}
        </div>

        {(inclusions.length > 0 || exclusions.length > 0) && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {inclusions.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wide" style={{ color: template.accentColor }}>
                  Inclusions
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  {inclusions.map((i) => (
                    <div key={i.uid}>
                      <p className="font-medium">{i.name}</p>
                      {i.contentHtml && <div className="prose-content text-gray-600" dangerouslySetInnerHTML={{ __html: i.contentHtml }} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {exclusions.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wide" style={{ color: template.accentColor }}>
                  Exclusions
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  {exclusions.map((i) => (
                    <div key={i.uid}>
                      <p className="font-medium">{i.name}</p>
                      {i.contentHtml && <div className="prose-content text-gray-600" dangerouslySetInnerHTML={{ __html: i.contentHtml }} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {terms.length > 0 && (
          <div className="mt-8">
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide" style={{ color: template.accentColor }}>
              Terms &amp; Conditions
            </p>
            <div className="flex flex-col gap-3 text-sm">
              {terms.map((t) => (
                <div key={t.uid}>
                  <p className="font-medium">{t.name}</p>
                  {t.contentHtml && <div className="prose-content text-gray-600" dangerouslySetInnerHTML={{ __html: t.contentHtml }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400">
          This quote is valid until {quote.validUntil ?? "the date agreed with your travel consultant"}. Prices are subject to availability at the time of booking.
        </p>
      </div>
    </div>
  );
}
