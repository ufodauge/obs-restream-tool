// import { useSyncExternalStore } from 'react';
// import type { ZodType } from 'zod';
// import { err, ok, type Result } from '../../result/result';

// const subscribeWindowSizeChange = (callback: () => void) => {
//   window.addEventListener('storage', callback);
//   return () => window.removeEventListener('storage', callback);
// };

// export const useWindowWidth = <T>(
//   key: string,
//   zod: ZodType<T>
// ): Result<T, Error> => {
//   const item = useSyncExternalStore(subscribeWindowSizeChange, () =>
//     localStorage.getItem(key)
//   );

//   const parsed = zod.safeParse(item);

//   return parsed.success ? ok(parsed.data) : err(parsed.error);
// };
