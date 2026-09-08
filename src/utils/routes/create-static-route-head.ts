export function createStaticRouteHead(title: string, description?: string) {
  return {
    meta: [{ title }, ...(description ? [{ name: "description", content: description }] : [])],
  };
}
