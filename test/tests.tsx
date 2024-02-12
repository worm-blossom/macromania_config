import { Config } from "../mod.tsx";
import { Context } from "../deps.ts";
import { assertEquals } from "../devDeps.ts";
import { FavoriteWord, FavoriteWordConfig } from "./favoriteWord.tsx";

Deno.test("favorite name example", () => {
  const ctx = new Context();
  const got = ctx.evaluate(
    <>
      <FavoriteWord />
      <Config options={<FavoriteWordConfig word="chouette" />}>
        <FavoriteWord />
        <Config options={<FavoriteWordConfig word="pneu" />}>
          <FavoriteWord />
        </Config>
        <FavoriteWord />
      </Config>
      <FavoriteWord />
    </>,
  );
  assertEquals(got, `defaultchouettepneuchouettedefault`);
});

Deno.test("setting multiple times in same options", () => {
  const ctx = new Context();
  const got = ctx.evaluate(
    <>
      <FavoriteWord />
      <Config options={<FavoriteWordConfig word="chouette" />}>
        <FavoriteWord />
        <Config
          options={[
            <FavoriteWordConfig word="foo" />,
            <FavoriteWordConfig word="pneu" />,
          ]}
        >
          <FavoriteWord />
        </Config>
        <FavoriteWord />
      </Config>
      <FavoriteWord />
    </>,
  );
  assertEquals(got, `defaultchouettepneuchouettedefault`);
});

Deno.test("error when usng setter outside Config options", () => {
  const ctx = new Context();
  const got = ctx.evaluate(
    <>
      <FavoriteWord />
      <Config options={<FavoriteWordConfig word="chouette" />}>
        <FavoriteWord />
        <Config
          options={<FavoriteWordConfig word="pneu" />}
        >
          <FavoriteWordConfig word="foo" />
          <FavoriteWord />
        </Config>
        <FavoriteWord />
      </Config>
      <FavoriteWord />
    </>,
  );
  assertEquals(got, null);
});

Deno.test("delayed invocation", () => {
  function A() {
    let i = 0;
    return (
      <impure
        fun={(ctx) => {
          if (i < 3) {
            i += 1;
            return null;
          } else {
            return "";
          }
        }}
      />
    );
  }

  function B() {
    let i = 0;
    return (
      <impure
        fun={(ctx) => {
          if (i < 2) {
            i += 1;
            return null;
          } else {
            return "";
          }
        }}
      />
    );
  }

  function C() {
    let i = 0;
    return (
      <impure
        fun={(ctx) => {
          if (i < 1) {
            i += 1;
            return null;
          } else {
            return "";
          }
        }}
      />
    );
  }
  const ctx = new Context();
  const got = ctx.evaluate(
    <>
      <FavoriteWord />
      <C />
      <Config options={<FavoriteWordConfig word="chouette" />}>
        <B />
        <FavoriteWord />
        <Config
          options={[
            <FavoriteWordConfig word="foo" />,
            <FavoriteWordConfig word="pneu" />,
          ]}
        >
          <A />
          <FavoriteWord />
        </Config>
        <FavoriteWord />
      </Config>
      <FavoriteWord />
    </>,
  );
  assertEquals(got, `defaultchouettepneuchouettedefault`);
});

Deno.test("omitting options", () => {
  const ctx = new Context();
  const got = ctx.evaluate(
    <>
      <FavoriteWord />
      <Config options={<FavoriteWordConfig word="chouette" upperCase />}>
        <FavoriteWord />
        <Config
          options={[
            <FavoriteWordConfig word="foo" />,
            <FavoriteWordConfig word="pneu" />,
          ]}
        >
          <FavoriteWord />
        </Config>
        <FavoriteWord />
      </Config>
      <FavoriteWord />
    </>,
  );
  assertEquals(got, `defaultCHOUETTEPNEUCHOUETTEdefault`);
});