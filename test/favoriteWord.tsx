import { makeConfigOptions } from "../mod.tsx";
import { Expression } from "../deps.ts";

type FavoriteWordOptions = {
  /**
   * This shows as docs on the `word` prop of the `FavoriteWordConfig` macro.
   */
  word?: string;
  upperCase?: boolean;
};

// The argument defines the default options.
const [
  FavoriteWordConfig,
  getter,
] = makeConfigOptions<FavoriteWordOptions>(
  "FavoriteWordConfig",
  {
    word: "default",
    upperCase: false,
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
