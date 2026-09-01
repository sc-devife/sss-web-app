import { notFound } from "next/navigation";
import { HotelDetailPanel } from "@/components/library/HotelDetailPanel";
import { getHotelByUid } from "@/lib/hotels";
import { getLocations } from "@/lib/locations";
import { getEscapePoints } from "@/lib/escape-points";
import { getMealPlans } from "@/lib/meal-plans";
import { getRoomTypes } from "@/lib/room-types";
import { getServices } from "@/lib/services";

export default async function Page({ params }: { params: { uid: string } }) {
  const [hotel, locations, escapePoints, mealPlans, roomTypes, services] = await Promise.all([
    getHotelByUid(params.uid).catch(() => null),
    getLocations(),
    getEscapePoints(),
    getMealPlans(),
    getRoomTypes(),
    getServices(),
  ]);

  if (!hotel) {
    notFound();
  }

  return (
    <HotelDetailPanel
      hotel={hotel}
      locations={locations}
      escapePoints={escapePoints}
      mealPlans={mealPlans}
      roomTypes={roomTypes}
      services={services}
    />
  );
}
