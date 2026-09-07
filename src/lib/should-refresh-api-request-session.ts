export function shouldRefreshApiRequestSession(
  status: number,
  path: string,
  headers: Record<string, string>,
  isRefreshing: boolean,
) {
  return (
    (status === 401 || status === 403) &&
    !isRefreshing &&
    Boolean(headers["X-Session-Token"]) &&
    !path.startsWith("/auth/")
  );
}
