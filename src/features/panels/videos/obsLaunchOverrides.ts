import type { ObsSyncSettings } from "./obsSyncSettings";

const nonEmpty = (value: string | null): string | null =>
  value === null || value === "" ? null : value;

/**
 * 配布パッケージ向けの設定シード（純粋関数）。
 *  - ?obsUrl= / ?obsPassword= : 与えられたら常にそれで上書き（ランチャーが
 *    起動のたびに OBS 側と一致させる。パスワードは初回に自動生成される）
 *  - ?obsScene= : sceneName が空のときだけ補う（ユーザーの変更は尊重）
 *  - 保存済み設定が無い初回のみ enable を true にする（クエリがあるとき）
 *  - ランチャーのクエリがあるとき（配布パッケージ: ランチャーが起動する
 *    http://localhost:<port>/ で app/ を配信）baseUrl はページ自身のディレクトリ。
 *    ポート変更に常に追従させる。クエリが無い通常環境（dev）では変えない。
 * 何も該当しなければ current をそのまま返す。
 */
export const applyLaunchOverrides = (
  current: ObsSyncSettings,
  hadStored: boolean,
  search: string,
  pageUrl: string,
): ObsSyncSettings => {
  const params = new URLSearchParams(search);
  const url = nonEmpty(params.get("obsUrl"));
  const password = nonEmpty(params.get("obsPassword"));
  const scene = nonEmpty(params.get("obsScene"));
  const hasParams = url !== null || password !== null || scene !== null;

  let baseUrl: string | null = null;
  try {
    if (hasParams) {
      baseUrl = new URL(".", new URL(pageUrl)).href.replace(/\/+$/, "");
    }
  } catch {
    // 不正な URL は通常環境扱い
  }

  const next: ObsSyncSettings = { ...current };
  if (url !== null) next.url = url;
  if (password !== null) next.password = password;
  if (scene !== null && current.sceneName === "") next.sceneName = scene;
  if (hasParams && !hadStored) next.enable = true;
  if (baseUrl !== null) next.baseUrl = baseUrl;
  return next;
};
