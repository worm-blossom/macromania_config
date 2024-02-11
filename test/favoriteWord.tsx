import { makeConfigOptions } from "../mod.tsx";
import { Expression } from "../deps.ts";

/**
 * Bar.
 */
type FavoriteWordOptions = {
  /**
   * Baz.
   */
  word: string;
};

// The argument defines the default options.
const [
  /**
   * ooo
   */
  FavoriteWordConfig, getter] = makeConfigOptions<FavoriteWordOptions>(
  "FavoriteWordConfig",
  {
    word: "default",
  },
);
/**
 * Foo.
 */
export {
  /**
   * uququ
   */
  FavoriteWordConfig};

export function FavoriteWord(): Expression {
  return <impure fun={(ctx) => getter(ctx).word} />;
}
