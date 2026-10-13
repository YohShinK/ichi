import { registerHooks, stripTypeScriptTypes } from "node:module";
import fs from "node:fs";

// Node 24 strips TS types. Repository ESM uses .js specifiers for its eventual
// compiled deployment; resolve only that repository source namespace to .ts.
registerHooks({
  load(url, context, nextLoad) {
    if (
      url.startsWith("file:") &&
      url.includes("/packages/v2-map/src/") &&
      url.endsWith(".ts")
    )
      return {
        format: "module",
        source: stripTypeScriptTypes(fs.readFileSync(new URL(url), "utf8"), {
          mode: "transform",
          sourceUrl: url,
        }),
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error.code !== "ERR_MODULE_NOT_FOUND" ||
        !specifier.endsWith(".js") ||
        !context.parentURL ||
        !specifier.startsWith(".")
      )
        throw error;
      const target = new URL(
        specifier.replace(/\.js$/u, ".ts"),
        context.parentURL,
      );
      if (
        !target.pathname.includes("/packages/v2-map/src/") ||
        !fs.existsSync(target)
      )
        throw error;
      return nextResolve(target.href, context);
    }
  },
});
