import { TextInput } from "sss-web-app";

export function Default() {
  return <TextInput label="Origin city" placeholder="e.g. Bengaluru" />;
}

export function RequiredWithError() {
  return <TextInput label="Email" required defaultValue="not-an-email" error="Enter a valid email address" />;
}
