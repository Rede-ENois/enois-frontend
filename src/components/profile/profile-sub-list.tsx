import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Pencil, Plus, Trash2 } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type ProfileSubField = {
  key: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
};

type ProfileSubListProps<T extends { id: string }, TData extends object> = {
  items: T[];
  fields: ProfileSubField[];
  currentlyHereKey?: string;
  createApi: (data: TData) => Promise<T>;
  updateApi: (id: string, data: TData) => Promise<T>;
  deleteApi: (id: string) => Promise<void>;
  queryKey: readonly unknown[];
  emptyMessage: string;
  newItem: Record<string, string>;
};

export function ProfileSubList<T extends { id: string }, TData extends object>({
  items,
  fields,
  currentlyHereKey,
  createApi,
  updateApi,
  deleteApi,
  queryKey,
  emptyMessage,
  newItem,
}: ProfileSubListProps<T, TData>) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...newItem });
  const [currentlyHere, setCurrentlyHere] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...newItem });
    setCurrentlyHere(false);
  };

  const create = useMutation({
    mutationFn: (data: TData) => createApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      resetForm();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TData }) => updateApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      resetForm();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const startEdit = (item: T) => {
    setEditingId(item.id);
    setForm(
      Object.fromEntries(
        fields.map((field) => [
          field.key,
          String((item as Record<string, unknown>)[field.key] ?? ""),
        ]),
      ),
    );
    if (currentlyHereKey) {
      setCurrentlyHere(Boolean((item as Record<string, unknown>)[currentlyHereKey]));
    }
  };

  const handleSubmit = async () => {
    const data: Record<string, unknown> = { ...form };
    if (currentlyHereKey) {
      data[currentlyHereKey] = currentlyHere;
      if (currentlyHere) data.endDate = null;
    }

    const typedData = data as unknown as TData;
    if (editingId && editingId !== "__new__") {
      await update.mutateAsync({ id: editingId, data: typedData });
      return;
    }
    await create.mutateAsync(typedData);
  };

  const isPending = create.isPending || update.isPending;
  const showForm = editingId !== null;

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="space-y-3 rounded-xl border border-border-soft p-4">
          {fields.map((field) => (
            <Field key={field.key} label={field.label}>
              {field.multiline ? (
                <Textarea
                  value={form[field.key] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  rows={2}
                  className="h-10 border-border-soft bg-surface-1"
                />
              ) : (
                <Input
                  type={field.type ?? "text"}
                  value={form[field.key] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  className="h-10 border-border-soft bg-surface-1"
                />
              )}
            </Field>
          ))}

          {currentlyHereKey && (
            <label className="flex items-center gap-2 text-[13px] font-light text-text-strong">
              <Switch checked={currentlyHere} onCheckedChange={setCurrentlyHere} />
              {texts.profile.edit.currentlyHere}
            </label>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending ? texts.common.saving : texts.common.save}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm}>
              {texts.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <p className="py-8 text-center text-[13px] font-light text-text-subtle">
              {emptyMessage}
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 text-[13px] font-light">
                    <p className="break-words text-text-strong">
                      {String((item as Record<string, unknown>)[fields[0].key] ?? "")}
                    </p>
                    <p className="break-words text-text-subtle">
                      {String((item as Record<string, unknown>)[fields[1]?.key] ?? "")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2"
                    >
                      <Pencil className="h-4 w-4 text-text-subtle" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5"
            onClick={() => {
              setEditingId("__new__");
              setForm({ ...newItem });
              setCurrentlyHere(false);
            }}
          >
            <Plus className="h-4 w-4" /> {texts.common.add}
          </Button>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-light text-text-subtle">{label}</Label>
      {children}
    </div>
  );
}
