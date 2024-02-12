# Macromania Config

A framework for easily adding principled, scoped configuration management to [Macromania](https://github.com/worm-blossom/macromania) macros.

Imagine a macro `<FavoriteWord />` whose output should be a configurable word, either in uppercase or not. When implemented with macromania-config, the user-facing configuration API works like this:

```tsx
<Config options={
  <FavoriteWordConfig word="chouette" upperCase/>
  {/* Config for further modules can go here as well. */}
}>
  <FavoriteWord />{/* Evaluates to "CHOUETTE". */}

  {/* You can locally override configuration options. */}
  <Config options={<FavoriteWordConfig word="pneu"/>}>
    <FavoriteWord />{/* Evaluates to "PNEU". */}
  </Config>

  {/* The override was purely local. */}
  <FavoriteWord />{/* Evaluates to "CHOUETTE". */}
</Config>
```

The implementation of the `favorite-word` package uses the declarative `makeConfigOptions` function provided by `macromania-config`:

```tsx
import { makeConfigOptions } from "./macromania-config";

// Optional properties remain unchanged when omitted from the
// `FavoriteWordConfig` props.
type FavoriteWordOptions = {
  word?: string;
  upperCase?: boolean;
};

const [FavoriteWordConfig, getter] = makeConfigOptions<FavoriteWordOptions>(
  "FavoriteWordConfig", // name of the macro function, used in stacktraces
  { word: "", upperCase: false }, // default value
);
export { FavoriteWordConfig };

export function FavoriteWord(): Expression {
  return <impure fun={(ctx) => {
    const word = getter(ctx).word!;
    return getter(ctx).upperCase! ? word.toUpperCase() : word;
  }} />;
}
```

That was the complete API.

`makeConfigOptions<T>(default: T)` returns a macro for setting the config options, and a function for getting them. Code that accesses the options should treat them as immutable.

The `<Config>` macro is used by the user to set configuration options via the setter macros returned by various calls to `makeConfigOptions`. These setters error when used outside the `options` prop of the `<Config>` macro. The setters overwrite the old config value, with the exception of `undefined` (i.e., omitted) properties. These retain the prior config value.