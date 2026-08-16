import { useAtom, useAtomValue } from "jotai";
import { CheckIcon } from "lucide-react";
import { useActionState, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import * as v from "valibot";

import {
  obsSyncSettingsSchema,
  obsSyncSettingsStore,
  SUBTEXT_POSITIONS,
  type ObsSyncSettings,
} from "@/features/panels/videos/obsSyncSettings";
import { videoPanelStores } from "@/features/panels/videos/panels";
import { mergeFormDataOverDefaults } from "@/libs/form/formData";
import { useFormDirty } from "@/libs/hooks/useFormDirty";

import { ObsSetupButton } from "./ObsSetupButton";

// select は input と違い placeholder / :placeholder-shown を持たないので、
// floating-label の「入力済みなら小さく浮く」トグルは効かない
// （常に浮いた状態になる。それ自体は不具合ではなく、select は元から
// 常に値を持っているので違和感は無い）。ラベル文字はここにまとめる。
const SUBTEXT_POSITION_LABELS: Record<
  (typeof SUBTEXT_POSITIONS)[number],
  string
> = {
  "bottom-full": "下部全幅（デフォルト）",
  "bottom-left": "左下",
  "bottom-right": "右下",
  "top-full": "上部全幅",
  "top-left": "左上",
  "top-right": "右上",
};

// useFormStatus は <form> の子孫コンポーネントでないと pending を取得できない
// ため、送信ボタンだけ切り出す。
const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
      <CheckIcon /> 保存
    </button>
  );
};

// 保存済みの値（settings）が変わるたびに、呼び出し元で key を変えてこの
// コンポーネントごと再マウントする。非制御フォームの defaultValue・enable
// トグルの useState・isDirty のベースラインが一緒に作り直されるので、
// 他ドックでの編集・自分の保存の両方が自然に反映される（A-8）。
const ObsSyncFormCard = ({
  settings,
  panelCount,
  onSave,
}: {
  settings: ObsSyncSettings;
  panelCount: number;
  onSave: (data: ObsSyncSettings) => void;
}): ReactNode => {
  const formRef = useRef<HTMLFormElement>(null);
  const { isDirty, handleInput } = useFormDirty(formRef);
  // watch("enable") の代わり。grid.* / area.* などは enabled が false の間
  // アンマウントされ FormData から消えるため、送信時は settings（直前の
  // 保存値）で穴埋めする（mergeFormDataOverDefaults）。
  const [enabled, setEnabled] = useState(settings.enable);

  const [error, formAction] = useActionState<string | null, FormData>(
    (_prevError, formData) => {
      const merged = mergeFormDataOverDefaults(settings, formData, ["enable"]);
      const parsed = v.safeParse(obsSyncSettingsSchema, merged);
      if (!parsed.success) {
        return "入力内容を確認してください";
      }
      onSave(parsed.output);
      return null;
    },
    null,
  );

  return (
    <div
      className={`card bg-base-100 shadow-sm card-border ${isDirty ? "border-error" : ""}`}
    >
      <form
        ref={formRef}
        action={formAction}
        onInput={handleInput}
        className="card-body grid gap-2 p-2"
      >
        <label className="label">
          <input
            type="checkbox"
            name="enable"
            className="toggle"
            defaultChecked={settings.enable}
            onChange={(e) => setEnabled(e.currentTarget.checked)}
          />
          obs-websocket 同期を有効化
        </label>

        {enabled ? (
          <>
            {/*
              D: ラベルと入力欄を横並びにする daisyUI の .label は、長い
              日本語ラベル（「スロット数（OBS 側に用意した Browser Source の
              数）」等）だとドックが狭いときに横幅を食い潰して崩れる。
              そこで 640px 未満でだけ floating-label（未入力時は placeholder
              として、入力後は input の左上に小さく浮くラベルとして表示）に
              切り替える。「幅があるときは横並び、狭いときは省スペース」を
              Tailwind の responsive variant だけで表現できる。

              向きが「.label を基本にして max-sm: で floating を足す」で
              あることが重要。逆の「floating-label sm:label」は効かない:
              .floating-label の `& > span { position: absolute }` は
              floating-label クラスが付いている限り全幅で生き続け、
              sm:label はコンテナ側の flex 指定を足すだけでその絶対配置を
              打ち消さないため、広い幅でもラベルが浮いたままになる。

              floating-label は :placeholder-shown 依存なので、対象の
              input には（見た目にはほぼ出ないものも含め）全て placeholder
              を付ける必要がある。select は placeholder を持てないので
              常に浮いた状態になる（値が常にあるので違和感は無い）。
            */}
            <label className="label max-sm:floating-label">
              <span>WebSocket URL</span>
              <input
                type="text"
                name="url"
                className="input input-sm"
                placeholder="ws://127.0.0.1:4455"
                defaultValue={settings.url}
                required
              />
            </label>
            <label className="label max-sm:floating-label">
              <span>password</span>
              <input
                type="password"
                name="password"
                className="input input-sm"
                placeholder="（未設定なら空欄）"
                defaultValue={settings.password}
              />
            </label>
            <label className="label max-sm:floating-label">
              <span>slot.html の配信元 URL</span>
              <input
                type="text"
                name="baseUrl"
                className="input input-sm"
                placeholder="http://localhost:5173"
                defaultValue={settings.baseUrl}
                required
              />
            </label>
            <label className="label max-sm:floating-label">
              <span>シーン名</span>
              <input
                type="text"
                name="sceneName"
                className="input input-sm"
                placeholder="動画スロットを置いているシーン名"
                defaultValue={settings.sceneName}
                required
              />
            </label>
            <label className="label max-sm:floating-label">
              <span>ソース名の接頭辞</span>
              <input
                type="text"
                name="sourcePrefix"
                className="input input-sm"
                placeholder="VideoSlot"
                defaultValue={settings.sourcePrefix}
                required
              />
            </label>
            <label className="label max-sm:floating-label">
              <span>スロット数（OBS 側に用意した Browser Source の数）</span>
              <input
                type="number"
                name="slotCount"
                min={1}
                className="input input-sm"
                placeholder="9"
                defaultValue={settings.slotCount}
                required
              />
            </label>
            {/*
              A-3: スロット index は「動画パネル一覧の N 番目」にそのまま
              対応する（有効なものだけ数えた index ではない）ので、
              無効化中のパネルも含めた panels.length 個ぶんスロットを
              用意しておく必要がある。不足分は同期の対象から外れて表示
              されない。
            */}
            {settings.slotCount < panelCount ? (
              <p className="text-xs text-warning">
                動画パネルが {panelCount} 件あります。スロット数が足りないと
                後ろのパネルが同期されません（スロット数 ≥ 動画パネル数を 推奨）
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <label className="label max-sm:floating-label">
                <span>グリッド列数</span>
                <input
                  type="number"
                  name="grid.cols"
                  min={1}
                  className="input input-sm"
                  placeholder="3"
                  defaultValue={settings.grid.cols}
                  required
                />
              </label>
              <label className="label max-sm:floating-label">
                <span>グリッド行数</span>
                <input
                  type="number"
                  name="grid.rows"
                  min={1}
                  className="input input-sm"
                  placeholder="3"
                  defaultValue={settings.grid.rows}
                  required
                />
              </label>
            </div>
            {/*
              gap は CSS では実現できない値（layout.ts の packGrid が矩形
              そのものをインセットして表現する）だが、フォーム上は
              グリッド・配置エリアと同じ「ジオメトリ」の一部として、この
              並びに置くのが自然。
            */}
            <label className="label max-sm:floating-label">
              <span>スロット間の隙間（px）</span>
              <input
                type="number"
                name="gap"
                min={0}
                className="input input-sm"
                placeholder="0"
                defaultValue={settings.gap}
                required
              />
            </label>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">配置エリア（px）</legend>
              <label className="label max-sm:floating-label">
                <span>X</span>
                <input
                  type="number"
                  name="area.x"
                  className="input input-sm"
                  placeholder="0"
                  defaultValue={settings.area.x}
                />
              </label>
              <label className="label max-sm:floating-label">
                <span>Y</span>
                <input
                  type="number"
                  name="area.y"
                  className="input input-sm"
                  placeholder="0"
                  defaultValue={settings.area.y}
                />
              </label>
              <label className="label max-sm:floating-label">
                <span>幅</span>
                <input
                  type="number"
                  name="area.width"
                  className="input input-sm"
                  placeholder="1920"
                  defaultValue={settings.area.width}
                />
              </label>
              <label className="label max-sm:floating-label">
                <span>高さ</span>
                <input
                  type="number"
                  name="area.height"
                  className="input input-sm"
                  placeholder="1080"
                  defaultValue={settings.area.height}
                />
              </label>
            </fieldset>
          </>
        ) : null}

        {/*
          borderRadius / subtextPosition は「OBS 側と自動同期するか」
          （enable）とは無関係にスロット自体の見た目（slot.html が常に
          読む値）を決めるので、enable の外に置いて常に編集できるようにする
          （enable が false のときも Browser Source 自体は OBS 上に存在し、
          見た目の設定だけは独立して効いていてほしい）。
        */}
        <fieldset className="fieldset">
          <legend className="fieldset-legend">スロットの見た目</legend>
          <label className="label max-sm:floating-label">
            <span>角丸半径（px）</span>
            <input
              type="number"
              name="borderRadius"
              min={0}
              className="input input-sm"
              placeholder="0"
              defaultValue={settings.borderRadius}
              required
            />
          </label>
          <label className="label max-sm:floating-label">
            <span>補助テキストの位置</span>
            <select
              name="subtextPosition"
              className="select select-sm"
              defaultValue={settings.subtextPosition}
            >
              {SUBTEXT_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {SUBTEXT_POSITION_LABELS[position]}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <SubmitButton />
        {error ? <p className="text-xs text-error">{error}</p> : null}

        {enabled && !isDirty ? (
          <ObsSetupButton settings={settings} />
        ) : enabled ? (
          <p className="text-xs text-warning">
            未保存の変更があります。先に保存してください
          </p>
        ) : null}
      </form>
    </div>
  );
};

export const ObsSyncForm = (): ReactNode => {
  const [settings, setSettings] = useAtom(obsSyncSettingsStore);
  const panels = useAtomValue(videoPanelStores);

  return (
    <ObsSyncFormCard
      key={JSON.stringify(settings)}
      settings={settings}
      panelCount={panels.length}
      onSave={setSettings}
    />
  );
};
