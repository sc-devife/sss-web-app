import { FileUpload } from "sss-web-app";

export function Empty() {
  return <FileUpload label="Escape point photos" value={[]} onChange={() => {}} />;
}
