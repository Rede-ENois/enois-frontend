/** Where a notification came from when it is a place (community or group), resolved by the backend. */
export type NotificationPlace = {
  type: "COMMUNITY" | "GROUP";
  id: string;
  name: string;
  color: string | null;
};
