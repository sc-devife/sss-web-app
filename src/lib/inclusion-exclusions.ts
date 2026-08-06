import { backendJson } from "@/lib/backend";

export type InclusionExclusionType = "INCLUSION" | "EXCLUSION" | "TERMS";

export interface InclusionExclusionItem {
  seqp: number;
  uid: string;
  name: string;
  type: InclusionExclusionType;
  contentHtml: string | null;
  escapePointId: string | null;
  sortOrder: number | null;
  isActive: boolean;
  escapePoint: { seqp: number; uid: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export async function getInclusionExclusions(type?: InclusionExclusionType): Promise<InclusionExclusionItem[]> {
  const query = type ? `?type=${type}` : "";
  return backendJson<InclusionExclusionItem[]>(`/api/library/inclusion-exclusions${query}`);
}

export async function getSelectableInclusionExclusions(
  itineraryUid: string,
  type: InclusionExclusionType,
): Promise<InclusionExclusionItem[]> {
  return backendJson<InclusionExclusionItem[]>(
    `/api/library/inclusion-exclusions/selectable?itineraryUid=${itineraryUid}&type=${type}`,
  );
}
