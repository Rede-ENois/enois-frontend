import { useState } from "react";

import { Textarea } from "@rede-enois/design-system/ui";
import { createRoot } from "react-dom/client";

import { PollComposer } from "../../../src/components/post/poll-composer";
import "../../../src/styles.css";

export function Fixture() {
  const [options, onChange] = useState(["", "", ""]);
  const [draft, setDraft] = useState("");

  return (
    <main className="mx-auto w-full max-w-xl p-5">
      <PollComposer options={options} onChange={onChange} />

      <form className="surface-card mt-5 p-5">
        <Textarea
          aria-label="Canal"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={1200}
          rows={3}
          className="w-full resize-y rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm font-normal outline-none transition focus:border-primary"
        />
      </form>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
