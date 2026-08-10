import { RichTextEditor } from "sss-web-app";

export function EscapeItinerary() {
  return (
    <RichTextEditor
      label="Day 2 notes"
      value="<p>Best visiting place in Karnataka, known for its coffee estates.</p><ul><li>2 nights stay at a homestay</li><li>Breakfast and dinner included</li><li>Evening trek to Mullayanagiri</li></ul>"
      onChange={() => {}}
    />
  );
}

export function EmptyWithPlaceholder() {
  return (
    <RichTextEditor
      label="Internal remarks"
      value=""
      onChange={() => {}}
      placeholder="Add notes for the ops team…"
    />
  );
}
