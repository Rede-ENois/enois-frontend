# Modelos de Dados

## UserProfile / Profile

```typescript
interface UserProfile {
  id: string;
  username: string;
  name: string;
  headline: string | null;
  email: string;
  company: string | null;
  location: string | null;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  skills: string[];
  goals: string[];
  availability: string | null;
  portfolio: string | null;
  externalLinks: string[];
  openToWork: boolean;
  isMentor: boolean;
  connectionsCount?: number;
  followersCount?: number;
  reputation?: number;
  /** Reputation drawn as a garden (stages 0..3, health 0..2); null in search and ranking. */
  garden?: {
    trajectory: number;
    relations: number;
    contribution: number;
    tenure: number;
    health: number;
  } | null;
  /** Equipped GARDEN shop item id; null draws the default garden ("quintal"). */
  gardenStyle?: string | null;
}
```

## Auth

```typescript
interface SignupInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthUser {
  id: string;
  username: string;
  name: string;
  headline: string;
  email: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  user: AuthUser;
}
```

## Experiência

```typescript
interface Experience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  currentlyHere: boolean;
  startDate: string | null;
  endDate: string | null;
}
```

## Educação

```typescript
interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  description: string | null;
  currentlyHere: boolean;
  startDate: string | null;
  endDate: string | null;
}
```

## Certificação

```typescript
interface Certification {
  id: string;
  name: string;
  issuer: string;
  description: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  credentialUrl: string | null;
}
```

## Post (PostView)

```typescript
interface PostView {
  id: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  authorAvatar: string | null;
  type: "INSIGHT" | "ARTICLE" | "QUESTION" | "PROJECT" | "OPPORTUNITY";
  content: string;
  tags: string[];
  mediaIds: string[];
  createdAt: string;
  visibility: "PUBLIC" | "CONNECTIONS" | "MENTORS";
  counters: {
    reactions: number;
    comments: number;
    saves: number;
    shares: number;
  };
  status: "ACTIVE" | "DELETED";
  currentUserReaction?: string | null;
}
```

## Comentário (CommentView)

```typescript
interface CommentView {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  status: "ACTIVE" | "DELETED";
}
```

## Post Types

```typescript
type PostType = "INSIGHT" | "ARTICLE" | "QUESTION" | "PROJECT" | "OPPORTUNITY";
```

## Reações

```typescript
type ReactionType =
  "LIKE" | "LOVE" | "LAUGH" | "WOW" | "SAD" | "CELEBRATE" | "SUPPORT" | "INSIGHTFUL";

interface ActionResponse {
  postId: string;
  status: string;
  counters: { reactions: number; comments: number; saves: number; shares: number };
}

interface ReactionItem {
  userId: string;
  type: string;
  createdAt: string;
}

interface ReactionsListResponse {
  postId?: string;
  summary: Record<string, number>;
  reactions: ReactionItem[];
}
```

## Comunidade

```typescript
interface Community {
  id: string;
  name: string;
  description: string;
  topic: string;
  members: number;
  joined: boolean;
  cover: string | null;
  avatar: string | null;
}

interface CommunityMember {
  userId: string;
  username: string;
  name: string;
  avatar: string | null;
  role: "ADMIN" | "MEMBER";
}
```

## Vagas (Job)

```typescript
interface Job {
  id: string;
  title: string;
  company: string;
  logo: string | null;
  location: string;
  type: string;
  level: string;
  salary: string | null;
  skills: string[];
  postedAt: string;
  matchScore: number | null;
}
```

## Evento

```typescript
interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  format: "ONLINE" | "IN_PERSON" | "HYBRID";
  host: string;
  attendees: number;
  cover: string | null;
  streamUrl: string | null;
  location: string | null;
  expired: boolean;
  /** Viewer confirmed attendance; false without session. */
  attending: boolean;
}
```

## Mentor

```typescript
interface Mentor {
  id: string;
  userId: string;
  expertise: string[];
  rating: number;
  sessions: number;
  price: string;
  nextSlot: string;
}

interface TimeSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
}
```

## Conversa

```typescript
interface Conversation {
  id: string;
  kind: "DIRECT" | "GROUP";
  title: string | null;
  participantIds: string[];
  lastMessage: string | null;
  time: string | null;
  unread: number;
}
```

## Mensagem

```typescript
interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
}
```

## Notificação

```typescript
interface Notification {
  id: string;
  kind: string;
  actorId: string | null;
  actorName: string | null;
  actorAvatar: string | null;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
  ctaLabel: string;
}
```

## Rede / Conexões

```typescript
interface NetworkUser {
  id: string;
  username: string;
  name: string;
  headline: string;
  avatar: string | null;
  connections: number;
  followers: number;
  connected: boolean;
}

interface NetworkSummary {
  userId: string;
  connections: number;
  followers: number;
  pendingRequests: number;
}

interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  direction: "INCOMING" | "OUTGOING";
  peer: NetworkUser; // a pessoa do outro lado
}

type ConnectionStatusResultStatus = "NONE" | "PENDING" | "ACCEPTED" | "REMOVED" | "BLOCKED";

interface ConnectionStatusResult {
  targetUserId: string;
  status: ConnectionStatusResultStatus;
  requestedByMe: boolean; // pedido pendente enviado por mim; false se recebi e nos demais status
  blocked: boolean;
  muted: boolean;
}
```

O `status` é igual para os dois lados da conexão. O perfil usa `requestedByMe` para oferecer
"Cancelar solicitação" a quem pediu e "Aceitar"/"Rejeitar" a quem recebeu
(`src/lib/network/connection-action.ts`).

## Mídia

```typescript
interface MediaAsset {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  purpose: string;
  status: string;
  uploadUrl: string | null;
  cdnUrl: string | null;
  createdAt: string;
}

interface MediaUploadResponse {
  id: string;
  uploadUrl: string;
  cdnUrl: string;
  status: "PENDING" | "UPLOADED" | "FAILED";
}
```

## Recomendação

```typescript
interface Recommendation {
  id: string;
  recommenderId: string;
  recommendedId: string;
  comment: string;
  createdAt: string;
}
```

## Ranking

```typescript
interface RankingUser {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  reputation: number;
}
```

## Denúncia (Report)

```typescript
type ReportReason =
  | "AI_GENERATED"
  | "FAKE_CONTENT"
  | "SCAM"
  | "DISCRIMINATION"
  | "PREJUDICE"
  | "HARASSMENT"
  | "SPAM"
  | "VIOLENCE"
  | "COPYRIGHT"
  | "OTHER";

interface ReportInput {
  targetId: string;
  targetType: "POST" | "COMMENT" | "USER";
  reason: ReportReason;
  description?: string;
}
```

## Busca

```typescript
interface SearchResult {
  id: string;
  type: "users" | "communities" | "jobs" | "events";
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
}
```

## Paginação

```typescript
interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}
```

## Respostas Padrão

### Sucesso (Escritas - CommandResponse)

```json
{ "status": 201, "body": { ... } }
```

### Sucesso (Leituras)

Retorno direto do objeto ou `PageResponse`.

### Erro

```json
{ "code": "ERROR_CODE", "message": "Descrição do erro.", "timestamp": "..." }
```

### Códigos de Erro

| Código                   | Significado                    |
| ------------------------ | ------------------------------ |
| INVALID_CREDENTIALS      | Email ou senha inválidos       |
| EMAIL_ALREADY_REGISTERED | Email já cadastrado            |
| UNAUTHENTICATED          | Sessão inválida ou expirada    |
| POST_NOT_FOUND           | Post não encontrado            |
| RATE_LIMITED             | Muitas requisições (429)       |
| DEPENDENCY_UNAVAILABLE   | Serviço indisponível (503)     |
| CONFLICT                 | Conflito de idempotência (409) |
