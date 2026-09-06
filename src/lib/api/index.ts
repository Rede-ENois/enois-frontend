export { authApi } from "./auth";
export type { SignUpInput, SignInInput, AuthUser, AuthResponse } from "./auth";

export { profileApi } from "./profile";
export type {
  Profile,
  UpdateProfileInput,
  Experience,
  ExperienceInput,
  Education,
  EducationInput,
  Certification,
  CertificationInput,
} from "./profile";

export { feedApi } from "./feed";
export type { PostView, CreatePostInput, PageResponse } from "./feed";

export { commentApi } from "./comment";
export type { CommentView } from "./comment";

export { reactionApi, REACTION_EMOJIS } from "./reaction";
export type {
  ActionResponse,
  ReactionType,
  ReactionItem,
  ReactionsListResponse,
} from "./reaction";

export { networkApi } from "./network";
export type {
  NetworkUser,
  NetworkSummary,
  ConnectionRequest,
  ConnectionStatus,
  ConnectionStatusDetails,
} from "./network";

export { mediaApi } from "./media";
export type { MediaUploadResponse, MediaAsset } from "./media";

export { communityApi } from "./community";
export type { Community, CreateCommunityInput, CommunityMember } from "./community";

export { jobApi } from "./job";
export type { Job, ListJobsOptions } from "./job";

export { eventApi } from "./event";
export type { Event, CreateEventInput } from "./event";

export { mentorApi } from "./mentor";
export type {
  Mentor,
  TimeSlot,
  CreateMentorInput,
  UpdateMentorInput,
  CreateTimeSlotInput,
} from "./mentor";

export { messageApi } from "./message";
export type { Conversation, Message, CreateConversationInput } from "./message";

export { notificationApi } from "./notification";
export type { Notification } from "./notification";

export { searchApi } from "./search";
export type { SearchResult } from "./search";

export { reportApi, REPORT_REASONS } from "./report";
export type { ReportReason, ReportInput } from "./report";

export { rankingApi } from "./ranking";
export type { RankingUser } from "./ranking";

export { userApi } from "./user";
export type { UserSearchResult } from "./user";

export { recommendationApi } from "./recommendation";
export type { Recommendation, CreateRecommendationInput } from "./recommendation";

export { api, ApiError, buildQuery, getSessionToken } from "../api-client";
