import { backendJson } from "@/lib/backend";

export type PlanningItemType =
  | "transport"
  | "pickup_drop"
  | "hotel"
  | "activity"
  | "sightseeing"
  | "meal"
  | "free_time"
  | "other";

export interface TransportLeg {
  legOrder: number;
  direction: "onward" | "return" | null;
  departureAirport: string | null;
  departureTerminal: string | null;
  departureTime: string | null;
  arrivalAirport: string | null;
  arrivalTerminal: string | null;
  arrivalTime: string | null;
  flightNumber: string | null;
}

export interface TransportDetail {
  modeCode: string | null;
  vehicleTypeCode: string | null;
  price: number | null;
  tripType: "one_way" | "round_trip" | "multi_city" | null;
  costPrice: number | null;
  costPricePerPerson: boolean | null;
  sellingPrice: number | null;
  sellingPricePerPerson: boolean | null;
  adultsCount: number | null;
  childrenCount: number | null;
  infantsCount: number | null;
  additionalOptions: string | null;
  legs: TransportLeg[];
}

export interface HotelInclusion {
  service: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  totalPrice: number | null;
  comments: string | null;
}

export interface HotelDetail {
  mealPlanId: string | null;
  roomTypeId: string | null;
  paxPerRoom: number | null;
  roomCount: number | null;
  adultsWithExtraBed: number | null;
  childrenWithExtraBed: number | null;
  childrenNoBed: number | null;
  complimentaryChildCount: number | null;
  price: number | null;
  totalPrice: number | null;
  inclusions: HotelInclusion[];
}

export interface ItineraryItem {
  uid: string;
  itineraryUid: string;
  dayNumber: number;
  itemType: PlanningItemType;
  referenceId: string | null;
  referenceLabel: string;
  source: "library" | "custom";
  title: string | null;
  startTime: string | null;
  notes: string | null;
  price: number | null;
  sortOrder: number;
  transportDetail: TransportDetail | null;
  hotelDetail: HotelDetail | null;
}

export async function getItemsForItinerary(itineraryUid: string): Promise<ItineraryItem[]> {
  return backendJson<ItineraryItem[]>(`/api/itinerary-items?itineraryUid=${itineraryUid}`);
}
