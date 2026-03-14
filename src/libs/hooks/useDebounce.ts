import { useEffect, useState } from "react";

export const useDebounce = <T>(input: T, delay: number): T => {
  const [value, setValue] = useState(input);

  useEffect(() => {
    const id = setTimeout(() => {
      setValue(input);
    }, delay);

    return () => clearTimeout(id);
  }, [delay, input]);

  return value;
};
