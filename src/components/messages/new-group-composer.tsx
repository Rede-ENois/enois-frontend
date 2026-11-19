import { useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { UserAvatar } from "@rede-enois/design-system/domain";
import { Button, Input, useToast } from "@rede-enois/design-system/ui";
import { Search } from "lucide-react";

import { messagesApi, networkApi } from "@/lib/api";
import { conversationErrorMessage } from "@/lib/conversation-error";
import { useCurrentUser } from "@/lib/current-user";

/**
 * Aba "Novo grupo": título e seleção MÚLTIPLA de pessoas. A busca é a mesma lista de pessoas de
 * /rede; a trava contra o toque duplo é a do "abrir conversa" — um segundo toque no mesmo tick
 * criaria um grupo repetido, porque `isPending` só chega à tela no próximo render.
 */
export function NewGroupComposer({ onCreated }: { onCreated: (conversationId: string) => void }) {
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // Enquanto ninguém digitou, o seletor abre vazio em vez de despejar a rede inteira.
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", query],
    queryFn: () => networkApi.list(query),
    enabled: query.length > 0,
  });
  const contacts = (searchResults?.items ?? []).filter((u) => u.id !== currentUserId);
  const status = !query
    ? texts.messages.groupSearchHint
    : contacts.length === 0
      ? texts.messages.noContact
      : null;
  const groupTitle = title.trim();

  const creatingRef = useRef(false);
  const createGroup = useMutation({
    mutationFn: () =>
      messagesApi.createConversation({
        kind: "GROUP",
        title: groupTitle,
        participantIds: Array.from(picked),
      }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onCreated(conv.id);
    },
    onError: (err) => toast(conversationErrorMessage(err), "error"),
  });

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-3">
      <Input
        aria-label={texts.messages.groupName}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={texts.messages.groupName}
        maxLength={80}
        className="h-9 rounded-full bg-muted"
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={texts.messages.searchContacts}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={texts.messages.searchContacts}
          className="h-9 rounded-full bg-muted pl-9"
        />
      </div>

      <div className="space-y-1" aria-live="polite">
        {status ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{status}</p>
        ) : (
          contacts.map((u) => {
            const on = picked.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                aria-pressed={on}
                disabled={createGroup.isPending}
                onClick={() => toggle(u.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                  on ? "bg-primary-soft" : "hover:bg-muted"
                }`}
              >
                <UserAvatar src={u.avatar} alt={u.name} className="h-10 w-10" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>

                  <p className="truncate text-xs text-muted-foreground">{u.headline}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <Button
        size="sm"
        className="w-full rounded-full"
        // Um grupo sem nome ou sem gente não é um grupo.
        disabled={groupTitle.length < 3 || picked.size === 0 || createGroup.isPending}
        onClick={() => {
          if (creatingRef.current) return;
          creatingRef.current = true;
          createGroup.mutate(undefined, {
            onSettled: () => {
              creatingRef.current = false;
            },
          });
        }}
      >
        {texts.messages.createGroup(picked.size)}
      </Button>
    </div>
  );
}
