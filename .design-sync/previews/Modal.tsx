import { Modal, Select, Button } from "sss-web-app";

export function ConfirmCancel() {
  return (
    <Modal open={true} onClose={() => {}} title="Cancel this escape?">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p className="text-sm text-foreground">
          This will cancel the Netravati escape for Sangmesh Rao and notify the traveller. This action cannot be
          undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" onClick={() => {}}>
            Keep escape
          </Button>
          <Button variant="danger" onClick={() => {}}>
            Cancel escape
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ReassignLead() {
  return (
    <Modal open={true} onClose={() => {}} title="Reassign lead">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Select
          label="Assign to"
          placeholder="Choose a team member"
          options={[
            { value: "priya", label: "Priya Nair" },
            { value: "arjun", label: "Arjun Mehta" },
            { value: "kavya", label: "Kavya Iyer" },
          ]}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" onClick={() => {}}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {}}>
            Reassign
          </Button>
        </div>
      </div>
    </Modal>
  );
}
