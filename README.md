# Macromania Config

A framework for easily adding principled, scoped configuration management to [Macromania](https://github.com/worm-blossom/macromania) macros.

Imagine a macro `<FavoriteWord />` whose output should be configurable. When implemented with macromania-config, the user-facing configuration API works like this:

```tsx
<Config options={
  <FavoriteWordConfig word="chouette"/>
  {/* config for further modules can go here as well*/}
}>
  <FavoriteWord />{/* evaluates to "chouette" */}

  {/* You can locally override configuration options */}
  <Config options={<FavoriteWordConfig word="pneu"/>}>
    <FavoriteWord />{/* evaluates to "pneu" */}
  </Config>

  {/* the override is purely local */}
  <FavoriteWord />{/* evaluates to "chouette" */}
</Config>
```

The implementation of the `favorite-word` package uses the declarative `makeConfigOptions` function provided by `macromania-config`:

```tsx
import { makeConfigOptions } from "./macromania-config";

type FavoriteWordOptions = {
  word: string;
};

const [FavoriteWordConfig, getter] = makeConfigOptions<FavoriteWordOptions>(
  "FavoriteWordConfig", // name of the macro function, used in stacktraces
  { word: "" }, // default value
);
export { FavoriteWordConfig };

export function FavoriteWord(): Expression {
  return <impure fun={(ctx) => getter(ctx).word} />;
}
```

That was the complete API.

`makeConfigOptions<T>(default: T)` returns a macro for setting the config options, and a function for getting them. Code that accesses the options should treat them as immutable.

The `<Config>` macro is used by the user to set configuration options via the setter macros returned by various calls to `makeConfigOptions`. These setters error when used outside the `options` prop of the `<Config>` macro.