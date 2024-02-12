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
type ConfigChange<S, U extends Record<string, any>> = {
  /**
   * Getter for the macromania state for this config value.
   */
  getter: (ctx: Context) => S;
  /**
   * Getter for the macromania state for this config value.
   */
  setter: (ctx: Context, t: S) => void;
  /**
   * The function for applying the update to the old state.
   */
  applyUpdate: (old: S, update: U) => S;
  /**
   * The value to set, excluding its undefined properties which remain
   * unchanged in the state.
   */
  changesToApply: U;
};

/**
 * `null` outside any `<Config>` invocations. Otherwise collects config changes
 * from the `options` of the most recent `<Config>` invocation.
 */
type ConfigState = null | ConfigChange<any, any>[];

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
    const changes = getState(ctx) as ConfigChange<any, any>[];

    // Not evaluating options anymore, config setters should fail again.
    setState(ctx, null);

    // A list of instructions how to revert the config state changes. Applied
    // in `post`.
    const revertChanges: [
      any, /*old state*/
      (ctx: Context, t: any) => void, /*setter*/
    ][] = [];
    for (const change of changes) {
      revertChanges.unshift([change.getter(ctx), change.setter]);
    }

    return <lifecycle pre={pre} post={post}>{expressions(children)}</lifecycle>;

    // Replace old config values with new ones.
    function pre(ctx: Context) {
      for (
        const {
          getter,
          setter,
          applyUpdate,
          changesToApply,
        } of changes
      ) {
        const old = getter(ctx);
        const new_ = applyUpdate(old, changesToApply);

        if (Object.is(old, new_)) {
          ctx.error(`Erroneous config macro, the applyUpdate function must return a new value, the old one (modified or not).`);
          return ctx.halt();
        }

        setter(ctx, new_);
      }
    }

    function post(ctx: Context) {
      for (const [oldState, setter] of revertChanges) {
        setter(ctx, oldState);
      }
    }
  }
}

/**
 * Create a getter function and a setter macro for config management.
 *
 * `S` is the type of the config state; there returned getter yields values of
 * type `S`.
 *
 * `U` is the type of updates; the returned setter macro uses type `U` for its
 * props.
 *
 * @param setterName - The name to use for the setter macro. This is what gets
 * printed in a Macromania stacktrace.
 * @param defaultValue - The value of the config options if they are not
 * explicitly set.
 * @param applyUpdate - A function that maps an old config state and an update to it
 * to a new config state. The return value must be a new value, this function
 * should not mutate its arguments.
 */
export function makeConfigOptions<S, U extends Record<string, any>>(
  setterName: string,
  defaultValue: S,
  applyUpdate: (old: S, update: U) => S,
): [(props: U) => Expression, (ctx: Context) => S] {
  const [getConfigState, setConfigState] = createSubstate<S>(defaultValue);

  const setterMacro = (props: U) => {
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
              applyUpdate,
              changesToApply: props,
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
