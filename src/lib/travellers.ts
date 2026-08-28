import { backendJson } from "@/lib/backend";

export type TravellerType = "ADULT" | "CHILD" | "INFANT";

export interface Traveller {
  uid: string;
  type: TravellerType | null;
  salutation: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  age: number | null;
  nationality: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
  passportIssuingCountry: string | null;
}

export async function getTravellers(): Promise<Traveller[]> {
  return backendJson<Traveller[]>("/traveller");
}
