/**
 * predicate が true を返すまで軽くポーリングする、テスト専用の待ち合わせ。
 * ObsSyncConnection は React の外側で setTimeout / WebSocket イベント駆動で
 * 状態遷移するので、fake timers ではなく実時間で待つ必要がある。
 */
export const waitFor = async (
  predicate: () => boolean,
  {
    timeoutMs = 2000,
    intervalMs = 5,
  }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor: timed out after ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
};
