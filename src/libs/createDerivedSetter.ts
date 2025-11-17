import type { Dispatch, SetStateAction } from "react";

/**
 * A型のセッターとBからAへの変換関数から、B型のセッターを導出する
 *
 * @param setter A型の状態を更新するためのReactセッター関数
 * @param inverseMapper B型の値からA型の新しい値を計算する関数
 * @returns B型の値をセットするためのセッター関数 (B | ((prevB: B) => B)) => void
 */
export const createDerivedSetter = <A, B>(
  setter: Dispatch<SetStateAction<A>>,
  mapper: (input: A) => B, // AからBへの変換関数
  inverseMapper: (nextB: B, prevA: A) => A, // BからAへの逆変換関数
): Dispatch<SetStateAction<B>> => {
  return (actionB: SetStateAction<B>) => {
    // setAを呼び出す際、関数形式の更新を渡して現在のprevAを取得
    setter((prevA) => {
      const prevB = mapper(prevA);

      let nextB: B;

      // actionBが関数か値かによって、nextBを決定
      if (typeof actionB === "function") {
        nextB = (actionB as (prevB: B) => B)(prevB);
      } else {
        nextB = actionB;
      }

      // nextB と prevA を使用して nextA を計算
      const nextA = inverseMapper(nextB, prevA);

      return nextA;
    });
  };
};
