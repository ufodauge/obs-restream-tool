import type { ZodType } from "zod";
import { err, ok, type Result } from "../../features/result/result";

export const tryParseJson = <T>(
  str: string,
  schema: ZodType<T>,
): Result<T, Error> => {
  try {
    const parsed = schema.safeParse(JSON.parse(str));
    return parsed.success ? ok(parsed.data) : err(parsed.error);
  } catch (error) {
    return err(
      Error("Failed to parse json", {
        cause: error,
      }),
    );
  }
};
