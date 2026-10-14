import type { SubtextPosition } from "./videos/obsSyncSettings";

// "bottom-full" が旧実装（right-1 bottom-1 left-1 の下部全幅バー）と
// 完全に一致する見た目なので、これが subtextPosition 未指定時の既定値。
// 全幅の 2 つ（bottom-full/top-full）は truncate 前提で左右いっぱいに
// 広げ、四隅の 4 つは幅を持たないぶん max-w で吹き出しがはみ出さないよう
// 絞る。
const SUBTEXT_POSITION_CLASSNAME_MAP: Record<SubtextPosition, string> = {
  "bottom-full": "right-1 bottom-1 left-1",
  "bottom-left": "bottom-1 left-1 max-w-[calc(100%-.5rem)]",
  "bottom-right": "right-1 bottom-1 max-w-[calc(100%-.5rem)]",
  "top-full": "top-1 right-1 left-1",
  "top-left": "top-1 left-1 max-w-[calc(100%-.5rem)]",
  "top-right": "top-1 right-1 max-w-[calc(100%-.5rem)]",
};

type Props = {
  src: string;
  subtext?: string;
  className?: string;
  /**
   * A-10: iframe のアクセシブルネーム。スクリーンリーダー等に
   * 「これが何の埋め込みか」を伝えるための必須情報なので呼び出し側で
   * 必ず具体的な値（配信者名・チャンネル名など）を渡す。
   */
  title: string;
  /**
   * 角丸半径（px）。省略時 0（丸めない = 従来の見た目のまま）。
   * Browser Source は既定で背景が透過なので、丸めた分だけ下のシーンが
   * 透けて見える。ラッパー側の overflow-hidden がクリップを担当するので、
   * ここでは radius の値をラッパーに inline style で渡すだけで良い
   */
  borderRadius?: number;
  /** subtext（配信者名などのラベル）の表示位置。省略時 "bottom-full"。 */
  subtextPosition?: SubtextPosition;
};

/**
 * 任意の iframe をシーンに配置するための土台。
 * 1 スロット = 1 Browser Source なので、常にビューポート全体を埋めて描画する
 * （サイズ・位置は OBS 側の SceneItemTransform が担当する）。
 * TwitchPanel や CustomPanel はこのコンポーネントの上に
 * src の組み立て方だけを差し替えて実装する。
 */
export const IframePanel = ({
  src,
  subtext,
  className,
  title,
  borderRadius,
  subtextPosition,
}: Props) => {
  const subtextPositionClassName =
    SUBTEXT_POSITION_CLASSNAME_MAP[subtextPosition ?? "bottom-full"];

  return (
    <div
      className={`relative h-svh w-svw overflow-hidden ${className ?? ""}`}
      // Tailwind の rounded-* は段階的な決め打ち値しか無く、OBS 側で任意の
      // px を設定できるようにするにはここだけ inline style にする必要がある。
      // クリップ自体は wrapper の overflow-hidden が担当するので、iframe 側
      // には何も付けなくてよい（Browser Source は既定で背景が透過なので、
      // 角を丸めた分だけ下のシーンが透けて見える）。
      style={{ borderRadius: `${borderRadius ?? 0}px` }}
    >
      <iframe
        src={src}
        title={title}
        // Twitch の autoplay（muted 前提）には permissions policy の委譲が
        // 必要。fullscreen はプレイヤー右下の全画面ボタン用。
        allow="autoplay; fullscreen"
        // Chrome 等のデフォルト値を明示するだけ（挙動は変えない）。
        // CustomPanel 経由では任意の外部 URL が来るため、"no-referrer" 等
        // より厳しい値にすると referrer 依存のホットリンク対策がある
        // サイトを壊しうる。Twitch は parent= クエリで埋め込み元を検証して
        // いるので referrer には依存しておらず、こちらを厳しくしても
        // Twitch 側は困らないが、汎用コンポーネントとして安全側に倒す。
        referrerPolicy="strict-origin-when-cross-origin"
        // A-10: sandbox は検討したが外した。Twitch プレイヤーは埋め込み元と
        // 別オリジンで動くため allow-scripts + allow-same-origin の組み合わせ
        // 自体は安全（同一オリジンではないので sandbox 解除攻撃は成立しない）
        // だが、CustomPanel 経由では任意の外部 URL がここに来る可能性があり、
        // 一律に何の sandbox 属性が安全かをこの汎用コンポーネント側で
        // 決め打ちできない（サイトごとに必要な許可が異なる）。実機の
        // Twitch iframe では sandbox="allow-scripts allow-same-origin
        // allow-popups allow-forms allow-presentation" が offline 表示・
        // ライブ再生とも無 sandbox 時と見分けが付かないことを確認済みだが、
        // CustomPanel の任意 URL まで一律にこれで十分と決め打つ根拠が
        // ないため、ここでは付けない。
        width="100%"
        height="100%"
      />
      {subtext ? (
        <span
          className={`pointer-events-none absolute truncate rounded-[5px] bg-neutral/70 px-3 py-px text-lg text-neutral-content ${subtextPositionClassName}`}
        >
          {subtext}
        </span>
      ) : null}
    </div>
  );
};
