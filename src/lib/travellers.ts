import { backendJson } from "@/lib/backend";

export interface Traveller {
  seqp: number;
  type: string | null;
  salutation: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  age: string | null;
  nationality: string | null;
}

export async function getTravellers(): Promise<Traveller[]> {
  return backendJson<Traveller[]>("/traveller");
}
