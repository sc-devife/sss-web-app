import { backendJson } from "@/lib/backend";

export interface RoomType {
  uid: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export async function getRoomTypes(): Promise<RoomType[]> {
  return backendJson<RoomType[]>("/api/v1/room-types");
}
