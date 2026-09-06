import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Pencil, Plus, Trash2 } from "lucide-react";

import { texts } from "@/texts";
import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";
import type { SubListUpdate } from "@/types/components/profile/edit-profile-dialog/sub-list-update";

import { Field } from "@/components/edit-profile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function SubList<
  T extends Record<"id", string>,
  TData extends Record<string, unknown> = Record<string, string>,
>({
  items,
  fields,
  currentlyHereKey,
  createApi,
  updateApi,
  deleteApi,
  queryKey,
  emptyMessage,
  newItem,
}: SubListProps<T, TData>) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...newItem });
  const [currentlyHere, setCurrentlyHere] = useState(false);

  const create = useMutation({
    mutationFn: (data: TData) => createApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setForm({ ...newItem });
      setCurrentlyHere(false);
      setEditingId(null);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: SubListUpdate<TData>) => updateApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingId(null);
      setForm({ ...newItem });
      setCurrentlyHere(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const startEdit = (item: T) => {
    setEditingId(item.id);
    const values: Record<string, string> = {};
    for (const f of fields) {
      values[f.key] = String((item as Record<string, unknown>)[f.key] ?? "");
    }
    setForm(values);
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
    if (editingId && editingId !== "__new__") {
      await update.mutateAsync({ id: editingId, data: data as TData });
    } else {
      await create.mutateAsync(data as TData);
    }
  };

  const isPending = create.isPending || update.isPending;
  const showForm = editingId !== null;

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="space-y-3 rounded-xl border border-border-soft p-4">
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.multiline ? (
                <Textarea
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  rows={2}
                  className="h-10 border-border-soft bg-surface-1"
                />
              ) : (
                <Input
                  type={f.type ?? "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="h-10 border-border-soft bg-surface-1"
                />
              )}
            </Field>
          ))}
          {currentlyHereKey && (
            <label className="flex items-center gap-2 text-[13px] font-light text-text-strong">
              <Switch checked={currentlyHere} onCheckedChange={setCurrentlyHere} />
              <>{texts.profile.edit.currentlyHere}</>
            </label>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending ? texts.common.saving : texts.common.save}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm({ ...newItem });
                setCurrentlyHere(false);
              }}
            >
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
                      onClick={() => startEdit(item)}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2"
                    >
                      <Pencil className="h-4 w-4 text-text-subtle" />
                    </button>
                    <button
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
            <Plus className="h-4 w-4" /><>{texts.common.add}</>
          </Button>
        </>
      )}
    </div>
  );
}
