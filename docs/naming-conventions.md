# Naming conventions

## Language

- Use **English for code identifiers, filenames, types, props, hooks, utilities, and API wrappers**.
- Keep Portuguese only where it is part of the public product surface, such as route URL segments and user-facing copy.

## Files and directories

- Use `kebab-case` for source filenames and directories.
- Prefer singular feature directories (`community`, `event`, `job`, `message`, `post`, `profile`).
- Name files after their primary exported responsibility. Avoid generic names such as `helpers`, `common`, or `data` when a domain/action name is available.
- Hooks use `use-*.ts`; use `.tsx` only when a file actually contains JSX.

## React components

- Use `PascalCase`.
- Route-level orchestration components end in `Page` (`FeedPage`, `NetworkPage`).
- Presentational components use a concrete role suffix when useful: `View`, `Card`, `Form`, `Dialog`, `Layout`, `Header`, `Sidebar`, `Section`, `List`.
- Props types are named `<ComponentName>Props`; avoid generic `Props` outside tiny private components.
- Boolean props/state begin with `is`, `has`, `can`, or `should` (`isOpen`, `isPending`, `hasFilters`).
- Callback props begin with `on` (`onSubmit`, `onConnect`, `onTabChange`).
- Internal event handlers begin with `handle` (`handleSubmit`, `handleConnect`).

## State and local variables

- Mutation objects end in `Mutation` (`createPostMutation`, `joinCommunityMutation`).
- Query result booleans keep React Query's `is*` form or are aliased to an `is*` name (`isFeedLoading`).
- Collections use plural nouns (`communities`, `messages`).
- Lookup objects use `ById` when keyed by IDs (`profileByUserId`).
- Avoid context-free names such as `data`, `item`, `value`, `open`, `pending`, or `status` when a domain-specific name is practical.

## IDs and parameters

- Entity IDs use `<entity>Id` (`communityId`, `currentUserId`).
- ID arrays use `<entity>Ids` (`participantIds`, `mentionedUserIds`).
- API parameters should name the target domain explicitly instead of plain `id`.
- Search text uses `query` unless the transport contract requires another field name.

## Types

- Domain entities use nouns (`Profile`, `Community`, `Event`).
- Client payloads use `Input` (`CreateCommunityInput`, `UpdateProfileInput`).
- Use `Request`/`Response` only for actual transport-level request/response wrappers.
- Avoid duplicate aliases for the same domain type.
- UI-only types should communicate their layer (`ConnectionUiState`, `NetworkRequestViewModel`).

## API wrappers

- API namespaces use a singular domain name when they represent one resource family (`communityApi`, `eventApi`, `jobApi`). Conceptual namespaces remain nouns such as `authApi`, `feedApi`, `networkApi`, and `searchApi`.
- Prefer explicit verbs:
  - `list` for the namespace's primary collection.
  - `getById`, `getByUsername` when the lookup key matters.
  - `create`, `update`, `remove` for CRUD.
  - `listMembers`, `listMessages`, `getSummary`, `getConnectionStatus` for nested/specialized operations.
- Avoid ambiguous API method names such as bare `get`, `status`, `summary`, `requests`, or `remove` when the affected entity is not obvious from the namespace.

## Utilities and hooks

- Utility names start with a verb describing the result/action (`formatEnumLabel`, `sortMessagesByTime`, `buildProfileUpdate`).
- `get*` is for retrieval/derivation without side effects; `create*`/`build*` constructs a new value; `format*` produces display text; `parse*` converts text/input into structured data.
- Query hooks end in `Query` and their files describe the queries they contain (`use-feed-queries.ts`).
