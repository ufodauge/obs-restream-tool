import { useEffect, useRef, useState, type RefObject } from "react";

const formDataToSortedEntries = (formData: FormData): string[] =>
  [...formData.entries()]
    .map(
      ([key, value]) =>
        `${key}=${typeof value === "string" ? value : value.name}`,
    )
    .sort();

const formDataEquals = (a: FormData, b: FormData): boolean => {
  const aEntries = formDataToSortedEntries(a);
  const bEntries = formDataToSortedEntries(b);
  return (
    aEntries.length === bEntries.length &&
    aEntries.every((entry, i) => entry === bEntries[i])
  );
};

/**
 * react-hook-form の formState.isDirty 相当を、素の <form> で再現する小さな
 * フック。<form ref={formRef} onInput={handleInput}> と組み合わせて使う。
 *
 * 「保存済みの値」との比較ではなく、マウント時点の FormData をベースラインに
 * する。呼び出し側のフォームは atom（保存済みの値）が変わるたびに key を
 * 変えて丸ごと再マウントする方針を取っているため、保存直後・他ドックからの
 * 変更直後はこのフックごと作り直され、ベースラインが自動的に最新化される。
 */
export const useFormDirty = (
  formRef: RefObject<HTMLFormElement | null>,
): { isDirty: boolean; handleInput: () => void } => {
  const baselineRef = useRef<FormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (formRef.current !== null) {
      baselineRef.current = new FormData(formRef.current);
    }
  }, [formRef]);

  const handleInput = () => {
    if (formRef.current === null || baselineRef.current === null) {
      return;
    }
    setIsDirty(
      !formDataEquals(new FormData(formRef.current), baselineRef.current),
    );
  };

  return { isDirty, handleInput };
};
