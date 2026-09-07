import { texts } from "@/texts";
import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { useSubListEditor } from "@/lib/use-sub-list-editor";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/components/form-field";

export function SubList<
  T extends Record<"id", string>,
  TData extends Record<string, unknown> = Record<string, string>,
>(props: SubListProps<T, TData>) {
  const { items, fields, currentlyHereKey, emptyMessage } = props;
  const editor = useSubListEditor(props);

  return (
    <div className="space-y-4">
      {editor.showForm ? (
        <div className="space-y-3 rounded-xl border border-border-soft p-4">
          {fields.map((field) => (
            <FormField
              key={field.key}
              label={field.label}
              labelClassName="text-[13px] font-light text-text-subtle"
            >
              {field.multiline ? (
                <Textarea
                  value={editor.form[field.key] ?? ""}
                  onChange={(event) => editor.setFormField(field.key, event.target.value)}
                  rows={2}
                  className="h-10 border-border-soft bg-surface-1"
                />
              ) : (
                <Input
                  type={field.type ?? "text"}
                  value={editor.form[field.key] ?? ""}
                  onChange={(event) => editor.setFormField(field.key, event.target.value)}
                  className="h-10 border-border-soft bg-surface-1"
                />
              )}
            </FormField>
          ))}
          {currentlyHereKey && (
            <label className="flex items-center gap-2 text-[13px] font-light text-text-strong">
              <Switch checked={editor.currentlyHere} onCheckedChange={editor.setCurrentlyHere} />

              <>{texts.profile.edit.currentlyHere}</>
            </label>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={editor.submit} disabled={editor.isPending}>
              {editor.isPending ? texts.common.saving : texts.common.save}
            </Button>

            <Button size="sm" variant="outline" onClick={editor.cancel}>
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
                      onClick={() => editor.startEdit(item)}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2"
                    >
                      <Pencil className="h-4 w-4 text-text-subtle" />
                    </button>

                    <button
                      onClick={() => editor.remove(item.id)}
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
            onClick={editor.startCreate}
          >
            <Plus className="h-4 w-4" />

            <>{texts.common.add}</>
          </Button>
        </>
      )}
    </div>
  );
}
