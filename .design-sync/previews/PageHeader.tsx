import { PageHeader, Button } from "sss-web-app";

export function Default() {
  return <PageHeader title="Escapes" description="Manage your agency's active and past escapes." />;
}

export function WithActions() {
  return (
    <PageHeader
      title="Leads"
      description="Track and assign incoming leads."
      actions={
        <>
          <Button variant="secondary">Import</Button>
          <Button variant="primary">Add lead</Button>
        </>
      }
    />
  );
}
