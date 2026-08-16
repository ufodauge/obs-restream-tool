const STORAGE_KEY_BASE = "t4j22pj0P1AD";

export const STORAGE_KEY_SCENE_SETTINGS = `${STORAGE_KEY_BASE}:scene-settings`;
export const STORAGE_KEY_PANEL_VIDEOS = `${STORAGE_KEY_BASE}:panel-videos`;
export const STORAGE_KEY_PANEL_BOARD_SEED = `${STORAGE_KEY_BASE}:panel-board-seed`;
export const STORAGE_KEY_PANEL_GLOBAL_TIMER = `${STORAGE_KEY_BASE}:panel-global-timer`;
export const STORAGE_KEY_OBS_SYNC_SETTINGS = `${STORAGE_KEY_BASE}:obs-sync-settings`;
// Phase 4: フルダッシュボード（index.html、?dock= 無し）で最後に選んでいた
// タブ。valibot 検証を伴う atomWithValidatedStorage の対象にするほどの
// データではないので、Dashboard.tsx から直接 localStorage で読み書きする。
export const STORAGE_KEY_DASHBOARD_TAB = `${STORAGE_KEY_BASE}:dashboard-tab`;

// ObsSetupButton（index.html 側、通常は sync.html とは別の OBS ドック =
// 別 JS 実行コンテキスト）が「シーンアイテムを作り終えたので今すぐ
// 同期し直してほしい」と sync.html 側の obsSyncConnection シングルトンに
// 伝えるためのシグナル。値の中身に意味は無く、書き込みそのもの（と
// それによって他ドックで発火する storage イベント）が合図になる。
// atomWithValidatedStorage の subscribe が使っているのと同じ
// 「storage イベントによるクロスドック通知」パターンを再利用している。
export const STORAGE_KEY_OBS_RESYNC_SIGNAL = `${STORAGE_KEY_BASE}:obs-resync-signal`;
