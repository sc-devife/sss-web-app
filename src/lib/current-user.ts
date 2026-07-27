import { backendJson } from "@/lib/backend";

export interface CurrentUser {
  seqp: number;
  uid: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  contact_number: string | null;
  roles: { role: { name: string; label: string } }[];
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return backendJson<CurrentUser>("/users/me");
}

export function roleNames(user: CurrentUser): string[] {
  return user.roles.map((r) => r.role.name);
}
