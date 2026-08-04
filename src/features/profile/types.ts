export interface MyProfileRole {
  role: { name: string; label: string };
}

export interface MyProfile {
  seqp: number;
  uid: string;
  userId: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  contact_number: string | null;
  roles: MyProfileRole[];
  organizationName: string | null;
  organizationLogo: string | null;
}

export interface UpdateMyProfilePayload {
  first_name: string;
  last_name: string;
  contact_number: string;
}
