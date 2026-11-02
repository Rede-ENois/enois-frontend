# #565 — conversation preview shows who sent the last message

The inbox preview (list in `/mensagens` and the dock) now prefixes the author of the last message:
"Você: ..." when the viewer sent it, and the sender's first name in a group ("Bia: ..."). A message
from the peer in a direct conversation stays as is.

Captured in the real app (Vite dev server against a local fake API with fictional people, E2E keys
generated on the spot by the app's own key manager; no real session or data), at 1280 and 390,
light and dark:

- `preview-1280-light.png` / `preview-1280-dark.png`: list and open dock.
- `preview-390-light.png` / `preview-390-dark.png`: list on the phone (the dock is desktop only).

In every capture: "Mel Santos / Você: teste 2" (own message), "Ana Souza / oi, tudo bem?" (peer's
message, no prefix) and "Grupo de estudos · Bia: amanhã às 19h" (group).
