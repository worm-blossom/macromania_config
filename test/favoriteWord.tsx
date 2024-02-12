import { makeConfigOptions } from "../mod.tsx";
import { Expression } from "../deps.ts";

type FavoriteWordOptions = {
  word: string;
  upperCase: boolean;
};

type FavoriteWordChanges = {
  /**
   * This shows as docs on the `word` prop of the `FavoriteWordConfig` macro.
   */
  word?: string;
  upperCase?: boolean;
};

const [
  FavoriteWordConfig,
  getter,
] = makeConfigOptions<FavoriteWordOptions, FavoriteWordChanges>(
  "FavoriteWordConfig",
  {
    word: "default",
    upperCase: false,
  },
  (oldValue, update) => {
    const newValue = { ...oldValue };
    if (update.word !== undefined) {
      newValue.word = update.word;
    }
    if (update.upperCase !== undefined) {
      newValue.upperCase = update.upperCase;
    }
    return newValue;
  },
);
export { FavoriteWordConfig };

export function FavoriteWord(): Expression {
  return (
    <impure
      fun={(ctx) => {
        const word = getter(ctx).word!;
        return getter(ctx).upperCase! ? word.toUpperCase() : word;
      }}
    />
  );
}
