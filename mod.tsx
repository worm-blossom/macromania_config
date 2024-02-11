// deno-lint-ignore-file no-explicit-any
import { Colors } from "./deps.ts";
import {
  Context,
  createSubstate,
  Expression,
  Expressions,
  expressions,
} from "./deps.ts";

/**
 * Information about a config value change, as produced by the config setters.
 */
type ConfigChange<T> = {
  /**
   * Getter for the macromania state for this config value.
   */
  getter: (ctx: Context) => T;
  /**
   * Getter for the macromania state for this config value.
   */
  setter: (ctx: Context, t: T) => void;
  /**
   * The value to set.
   */
  newValue: T;
};

/**
 * `null` outside any `<Config>` invocations. Otherwise collects config changes
 * from the `options` of the most recent `<Config>` invocation.
 */
type ConfigState = null | ConfigChange<any>[];

const [getState, setState] = createSubstate<ConfigState>(null);

/**
 * Apply configuration options to all children.
 *
 * @param options - Invoke config setters here. Evaluated only once.
 * @returns The rendered `children`, evaluated under updated config options.
 */
export function Config(
  { options, children }: { options: Expressions; children: Expressions },
): Expression {
  // Evaluate `options` once, collecting changes into the ConfigState, ...
  return (
    <impure
      fun={(ctx) => {
        setState(ctx, []);
        return <map fun={updateConfigAndEvalChildren}>{options}</map>;
      }}
    />
  );

  // ... then add lifecycle hooks and evaluate children.
  function updateConfigAndEvalChildren(
    _evaled: string,
    ctx: Context,
  ): Expression {
    // The changes to apply in `pre`, as collected from the config setter
    // macros among the `options`.
    const changes = getState(ctx) as ConfigChange<any>[];

    // Not evaluating options anymore, config setters should fail again.
    setState(ctx, null);

    // A list of instructions how to revert the config state changes. Applied
    // in `post`.
    const revertChanges: ConfigChange<any>[] = [];
    for (const change of changes) {
      revertChanges.unshift({
        getter: change.getter,
        setter: change.setter,
        newValue: change.getter(ctx),
      });
    }

    return <lifecycle pre={pre} post={post}>{expressions(children)}</lifecycle>;

    // Replace old config values with new ones.
    function pre(ctx: Context) {
      for (const change of changes) {
        change.setter(ctx, change.newValue);
      }
    }

    function post(ctx: Context) {
      for (const change of revertChanges) {
        change.setter(ctx, change.newValue);
      }
    }
  }
}

/**
 * Create a getter function and a setter macro for config options of type `T`.
 * @param setterName - The name to use for the setter macro. This is what gets
 * printed in a Macromania stacktrace.
 * @param defaultValue - The value of the config options if they are not
 * explicitly set.
 */
export function makeConfigOptions<T>(
  setterName: string,
  defaultValue: T,
): [(props: T) => Expression, (ctx: Context) => T] {
  const [getConfigState, setConfigState] = createSubstate<T>(defaultValue);

  const setterMacro = (props: T) => {
    return (
      <impure
        fun={(ctx: Context) => {
          const state = getState(ctx);
          if (state === null) {
            ctx.error(
              `To set configuration options, invoke the ${
                Colors.yellow(`<${setterName} />`)
              } in the ${Colors.yellow("options")} prop of the ${
                Colors.yellow("<Config>")
              } macro.`,
            );
            ctx.error(
              `Using this macro anywhere else deliberately causes an error.`,
            );
            return ctx.halt();
          } else {
            state.push({
              getter: getConfigState,
              setter: setConfigState,
              newValue: props,
            });
            return "";
          }
        }}
      />
    );
  };
  Object.defineProperty(setterMacro, "name", {
    value: setterName,
    writable: false,
  });

  const getterFunction = (ctx: Context) => getConfigState(ctx);

  return [setterMacro, getterFunction];
}
