import * as v from "valibot";

import { ok, err, type Result } from "../result/result";

export const tryParseJson = <T>(
  str: string,
  schema: v.GenericSchema<unknown, T>,
): Result<T, Error> => {
  try {
    const parsed = v.safeParse(schema, JSON.parse(str));
    if (parsed.success) {
      return ok(parsed.output);
    }
    return err(
      new Error(parsed.issues.map((issue) => issue.message).join("\n")),
    );
  } catch (error) {
    return err(
      Error("Failed to parse json", {
        cause: error,
      }),
    );
  }
};
