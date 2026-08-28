"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Body, Caption, Heading } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import type { Team } from "@/lib/teams";
import type { EscapePoint } from "@/lib/escape-points";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTeams, createTeam, updateTeam, deleteTeam } from "@/features/teams/teamsThunks";
import { selectTeams, selectTeamsStatus, selectTeamsError } from "@/features/teams/teamsSelectors";
import { fetchUsers } from "@/features/users/usersThunks";
import { selectOrgUsers } from "@/features/users/usersSelectors";
import { FaPlus, FaUsers } from "react-icons/fa";
import { PiUsersThreeFill } from "react-icons/pi";

const emptyForm = {
  name: "",
  description: "",
  status: "ACTIVE",
  specializedEscapePoints: [] as string[],
  teamLeadUserId: "",
  maxConcurrentAssignments: "",
};

type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const nameErr = runValidators(v.name, [required("Name is required")]);
  if (nameErr) errors.name = nameErr;
  return errors;
}

export function TeamsPanel({ escapePoints }: { escapePoints: EscapePoint[] }) {
  const dispatch = useAppDispatch();
  const teams = useAppSelector(selectTeams);
  const status = useAppSelector(selectTeamsStatus);
  const error = useAppSelector(selectTeamsError);
  const users = useAppSelector(selectOrgUsers);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deactivatingUid, setDeactivatingUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTeams());
    dispatch(fetchUsers());
  }, [dispatch]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOriginal(null);
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(team: Team) {
    const snapshot: FormState = {
      name: team.name,
      description: team.description ?? "",
      status: team.status,
      specializedEscapePoints: (team.specializedEscapePoints ?? []).map(String),
      teamLeadUserId: team.teamLeadUserId != null ? String(team.teamLeadUserId) : "",
      maxConcurrentAssignments: team.maxConcurrentAssignments != null ? String(team.maxConcurrentAssignments) : "",
    };
    setEditing(team);
    setForm(snapshot);
    setOriginal(snapshot);
    setErrors({});
    setFormError(undefined);
    setModalOpen(true);
  }

  const isDirty = useIsDirty(original, form);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editing && !isDirty) return;
    setFormError(undefined);

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      status: form.status,
      specializedEscapePoints: form.specializedEscapePoints.map(Number),
      teamLeadUserId: form.teamLeadUserId ? Number(form.teamLeadUserId) : null,
      maxConcurrentAssignments: form.maxConcurrentAssignments ? Number(form.maxConcurrentAssignments) : null,
    };

    try {
      if (editing) {
        await dispatch(updateTeam({ uid: editing.uid, payload })).unwrap();
      } else {
        await dispatch(createTeam(payload)).unwrap();
      }
      dispatch(fetchTeams());
      setModalOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save team"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(team: Team) {
    setDeactivatingUid(team.uid);
    try {
      await dispatch(deleteTeam(team.uid));
      dispatch(fetchTeams());
    } finally {
      setDeactivatingUid(null);
    }
  }

  if (status === "loading" && teams.length === 0) {
    return <LoadingState label="Loading teams…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <FaPlus />
          Add team
        </Button>
      </div>

      {teams.length === 0 ? (
        <EmptyState icon={FaUsers} title="No teams yet" description="Create a team to group agents by destination specialization." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.uid} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                    <PiUsersThreeFill className="h-4 w-4" />
                  </div>
                  <Heading as="h4" className="text-sm font-semibold">
                    {team.name}
                  </Heading>
                </div>
                <Badge tone={team.status === "ACTIVE" ? "success" : "neutral"}>{team.status}</Badge>
              </div>

              {team.description && <Body className="text-xs text-muted-foreground">{team.description}</Body>}

              <div className="flex flex-col gap-1">
                <Caption className="font-medium text-foreground">Specializes in</Caption>
                {team.specializedEscapePoints && team.specializedEscapePoints.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {team.specializedEscapePoints.map((seqp) => {
                      const ep = escapePoints.find((e) => e.seqp === seqp);
                      return (
                        <Badge key={seqp} tone="neutral">
                          {ep?.name ?? `#${seqp}`}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <Caption className="text-muted-foreground">Not set</Caption>
                )}
              </div>

              {team.teamLeadUserName && (
                <div className="flex items-center gap-2">
                  <Caption className="font-medium text-foreground">Team lead</Caption>
                  <Caption className="text-muted-foreground">{team.teamLeadUserName}</Caption>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <Caption className="font-medium text-foreground">
                  Members ({team.members.length}
                  {team.maxConcurrentAssignments != null ? ` · cap ${team.maxConcurrentAssignments}` : ""})
                </Caption>
                {team.members.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {team.members.map((m) => (
                      <span key={m.uid} title={m.name} className="flex items-center gap-1 rounded-full border border-border bg-muted/40 py-0.5 pl-0.5 pr-2">
                        <Avatar name={m.name} />
                        <span className="text-xs text-foreground">{m.name}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <Caption className="text-muted-foreground">No members yet — assign teams from a user's edit panel.</Caption>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-3">
                <Button variant="secondary" size="sm" onClick={() => openEdit(team)}>
                  Edit
                </Button>
                {team.status === "ACTIVE" && (
                  <Button variant="danger" size="sm" disabled={deactivatingUid === team.uid} onClick={() => handleDeactivate(team)}>
                    Deactivate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
        }}
        title={editing ? "Edit team" : "Add team"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="contents">
            <TextInput
              label="Name"
              value={form.name}
              onChange={(e) => {
                update("name", e.target.value);
                setErrors((p) => ({ ...p, name: "" }));
              }}
              error={errors.name}
              required
            />

            <TextInput label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} />

            <MultiSelect
              label="Specializes in (escape points)"
              options={escapePoints.map((ep) => ({ value: String(ep.seqp), label: ep.name }))}
              value={form.specializedEscapePoints}
              onChange={(next) => update("specializedEscapePoints", next)}
            />

            <Select
              label="Team lead"
              options={users.map((u) => ({ value: String(u.seqp), label: u.name }))}
              value={form.teamLeadUserId}
              onChange={(e) => update("teamLeadUserId", e.target.value)}
              placeholder="No team lead"
            />

            <TextInput
              label="Max concurrent assignments (team-wide)"
              type="number"
              min={0}
              value={form.maxConcurrentAssignments}
              onChange={(e) => update("maxConcurrentAssignments", e.target.value)}
              placeholder="No cap"
            />

            <Select
              label="Status"
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            />
          </fieldset>

          {formError && (
            <Alert tone="danger" autoClose={false}>
              {formError}
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || (!!editing && !isDirty)} loading={saving} loadingText="Saving…">
              Save team
            </Button>
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
