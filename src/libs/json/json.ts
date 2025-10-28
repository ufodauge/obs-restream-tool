import type { ZodType } from "zod";
import { ok, err, type Result } from "../result/result";

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
