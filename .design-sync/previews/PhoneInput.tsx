import { PhoneInput } from "sss-web-app";

export function Default() {
  return (
    <PhoneInput
      label="Traveller phone"
      value="+919876543210"
      onChange={() => {}}
      defaultCountry="IN"
      required
    />
  );
}

export function WithError() {
  return (
    <PhoneInput
      label="Traveller phone"
      value=""
      onChange={() => {}}
      defaultCountry="IN"
      required
      error="Enter a valid phone number"
    />
  );
}
