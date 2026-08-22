import type { RoomType } from "@/lib/room-types";

export type { RoomType };

export interface RoomTypePayload {
  name: string;
  description: string;
}

export interface UpdateRoomTypePayload {
  uid: string;
  payload: RoomTypePayload & { isActive: boolean };
}
