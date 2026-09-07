export function createPostCardDisposalScheduler() {
  const pendingDisposals = new Map<string, ReturnType<typeof setTimeout>>();

  const cancel = (postId: string) => {
    const pendingDisposal = pendingDisposals.get(postId);
    if (!pendingDisposal) return;

    clearTimeout(pendingDisposal);
    pendingDisposals.delete(postId);
  };

  const schedule = (postId: string, dispose: () => void) => {
    cancel(postId);
    pendingDisposals.set(
      postId,
      setTimeout(() => {
        dispose();
        pendingDisposals.delete(postId);
      }, 0),
    );
  };

  return { cancel, schedule };
}
