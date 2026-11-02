import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { CompanyDetail } from "@/types/application/companies/company-detail";
import type { MicroProjectView } from "@/types/application/companies/micro-project-view";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";

import { companiesApi } from "@/lib/api";
import { companyQueries } from "@/lib/query-options/companies";

const copy = texts.empresa.projectManagement;

export function MicroProjectManagement({ company }: { company: CompanyDetail }) {
  const [editing, setEditing] = useState<MicroProjectView | null>(null);
  const [removing, setRemoving] = useState<MicroProjectView | null>(null);
  const client = useQueryClient();
  const { toast } = useToast();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: companyQueries.detail(company.slug).queryKey });
    void client.invalidateQueries({ queryKey: companyQueries.directoryKey });
  };
  const remove = useMutation({
    mutationFn: (id: string) => companiesApi.removeProject(id),
    onSuccess: () => {
      setRemoving(null);
      toast(copy.removed, "success");
      refresh();
    },
    onError: () => {
      toast(copy.error, "error");
      refresh();
    },
  });
  const eligible = company.projects.filter(
    (project) => project.status === "OPEN" && project.proposalCount === 0,
  );
  if (!eligible.length) return null;
  return (
    <section className="mx-auto mt-6 max-w-5xl space-y-3 rounded-xl border border-border-soft p-4">
      <h2 className="text-lg font-semibold">{copy.title}</h2>

      <p className="text-sm text-muted-foreground">{copy.hint}</p>

      <ul className="space-y-3">
        {eligible.map((project) => (
          <li key={project.id} className="flex flex-wrap items-center justify-between gap-3">
            <span className="min-w-0 break-words">{project.title}</span>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(project)}>
                {copy.edit}
              </Button>

              <Button size="sm" variant="outline" onClick={() => setRemoving(project)}>
                {copy.remove}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <EditProjectDialog
          key={editing.id}
          project={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast(copy.saved, "success");
            refresh();
          }}
          onFailed={refresh}
        />
      )}
      <Dialog
        open={removing !== null}
        onOpenChange={(open) => !open && !remove.isPending && setRemoving(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.confirmTitle}</DialogTitle>

            <DialogDescription>{copy.confirmHint}</DialogDescription>
          </DialogHeader>

          <p className="break-words">{removing?.title}</p>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={remove.isPending} onClick={() => setRemoving(null)}>
              {copy.cancel}
            </Button>

            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => removing && remove.mutate(removing.id)}
            >
              {copy.remove}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EditProjectDialog({
  project,
  onClose,
  onSaved,
  onFailed,
}: {
  project: MicroProjectView;
  onClose: () => void;
  onSaved: () => void;
  onFailed: () => void;
}) {
  const edit = useMutation({
    mutationFn: (data: FormData) =>
      companiesApi.editProject(project.id, {
        title: String(data.get("title") ?? "").trim(),
        problem: String(data.get("problem") ?? "").trim(),
        scope: String(data.get("scope") ?? "").trim(),
        deliverables: String(data.get("deliverables") ?? "").trim(),
        acceptanceCriteria: String(data.get("acceptance") ?? "").trim(),
        budget: String(data.get("budget") ?? "").trim(),
        deadline: String(data.get("deadline") ?? "") || undefined,
      }),
    onSuccess: onSaved,
    onError: onFailed,
  });
  return (
    <Dialog open onOpenChange={(open) => !open && !edit.isPending && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{copy.editTitle}</DialogTitle>

          <DialogDescription>{copy.editHint}</DialogDescription>
        </DialogHeader>

        <form
          className="min-w-0 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            edit.mutate(new FormData(event.currentTarget));
          }}
        >
          <Label htmlFor="mp-title">{copy.name}</Label>

          <Input
            id="mp-title"
            name="title"
            defaultValue={project.title}
            required
            minLength={8}
            maxLength={200}
          />

          <Label htmlFor="mp-problem">{copy.problem}</Label>

          <Textarea
            id="mp-problem"
            name="problem"
            defaultValue={project.problem}
            required
            minLength={30}
            maxLength={4000}
          />

          <Label htmlFor="mp-scope">{copy.scope}</Label>

          <Textarea
            id="mp-scope"
            name="scope"
            defaultValue={project.scope ?? ""}
            maxLength={4000}
          />

          <Label htmlFor="mp-deliverables">{copy.deliverables}</Label>

          <Textarea
            id="mp-deliverables"
            name="deliverables"
            defaultValue={project.deliverables ?? ""}
            required
            maxLength={4000}
          />

          <Label htmlFor="mp-acceptance">{copy.acceptance}</Label>

          <Textarea
            id="mp-acceptance"
            name="acceptance"
            defaultValue={project.acceptanceCriteria ?? ""}
            required
            maxLength={4000}
          />

          <Label htmlFor="mp-budget">{copy.budget}</Label>

          <Input id="mp-budget" name="budget" defaultValue={project.budget ?? ""} maxLength={160} />

          <Label htmlFor="mp-deadline">{copy.deadline}</Label>

          <Input
            id="mp-deadline"
            name="deadline"
            type="date"
            defaultValue={project.deadline ?? ""}
          />
          {edit.isError && (
            <p role="alert" className="text-sm text-destructive">
              {copy.error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={edit.isPending} onClick={onClose}>
              {copy.cancel}
            </Button>

            <Button type="submit" disabled={edit.isPending}>
              {copy.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
