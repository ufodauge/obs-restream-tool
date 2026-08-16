/**
 * FormData の "a.b" 形式のキーを { a: { b: value } } というネストした
 * プレーンオブジェクトに変換する。
 *
 * react-hook-form の register("grid.cols") はこのネスト展開を自動でやって
 * くれていたが、React 19 の form actions + FormData に移行すると自前で
 * 展開する必要がある（ObsSyncForm の grid.* / area.* 用）。
 *
 * 値は FormDataEntryValue（string | File）のまま返す。数値・真偽値への変換は
 * 呼び出し側の valibot スキーマ（v.transform(Number) 等）に任せる。
 */
export const formDataToNestedObject = (
  formData: FormData,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    const segments = key.split(".");
    const leaf = segments[segments.length - 1];
    let cursor = result;

    for (const segment of segments.slice(0, -1)) {
      const next = cursor[segment];
      if (typeof next !== "object" || next === null) {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as Record<string, unknown>;
    }

    cursor[leaf] = value;
  }

  return result;
};

/**
 * 条件付きレンダリングで消えているフィールドは FormData にキーごと現れない
 * （react-hook-form は shouldUnregister: false がデフォルトなので値を保持して
 * くれていたが、素の <form> + FormData ではそうならない）。
 *
 * このヘルパーは「現在保存されている値」の上に、今回の FormData を浅くマージする
 * ことで、非表示中のフィールドは直前の保存値を維持したまま送信できるようにする。
 *
 * ただしチェックボックスは特別扱いが必要: 未チェックのとき FormData に
 * キー自体が存在しないため、そのままマージすると「消えている＝直前の値のまま」
 * と誤解釈されてしまう（オフにして保存したのに ON のままになる）。
 * checkboxKeys に列挙したキーは常に formData.has(key) の結果で上書きする。
 */
export const mergeFormDataOverDefaults = <T extends object>(
  current: T,
  formData: FormData,
  checkboxKeys: readonly (keyof T & string)[] = [],
): Record<string, unknown> => {
  const merged: Record<string, unknown> = {
    ...current,
    ...formDataToNestedObject(formData),
  };

  for (const key of checkboxKeys) {
    merged[key] = formData.has(key);
  }

  return merged;
};
