import { backendJson } from "@/lib/backend";

export interface LibraryLocation {
  uid: string;
  city: string;
  state: string | null;
  country: string | null;
  displayName: string;
  isActive: boolean;
}

export async function getLocations(): Promise<LibraryLocation[]> {
  return backendJson<LibraryLocation[]>("/api/v1/locations");
}
