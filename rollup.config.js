import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import serve from "rollup-plugin-serve";
import terser  from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import minifyHTML from 'rollup-plugin-minify-html-literals';

const dev = process.env.ROLLUP_WATCH;

const serveOptions = {
  contentBase: ["./dist"],
  host: "0.0.0.0",
  port: 5001,
  allowCrossOrigin: true,
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

export default [
  {
    input: ["src/power-flow-card-plus.ts"],
    output: [
      {
        dir: "dist",
        format: "es",
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      minifyHTML(),
      terser({ output: { comments: false } }),
      typescript({
        declaration: false,
      }),
      nodeResolve(),
      json({
        compact: true,
      }),
      commonjs(),
      babel({
        exclude: "node_modules/**",
        babelHelpers: "bundled",
      }),
      ...(dev ? [serve(serveOptions)] : [terser()]),
    ],
    moduleContext: (id) => {
      const thisAsWindowForModules = [
        "node_modules/@formatjs/intl-utils/lib/src/diff.js",
        "node_modules/@formatjs/intl-utils/lib/src/resolve-locale.js",
      ];
      if (thisAsWindowForModules.some((id_) => id.trimRight().endsWith(id_))) {
        return "window";
      }
    },
  },
];
