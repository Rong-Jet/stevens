import esbuild from "esbuild";
import { readFile } from "node:fs/promises";

const watch = process.argv.includes("--watch");
const env = await readEnvFile(".env");

const shared = {
  bundle: true,
  platform: "browser",
  target: "chrome114",
  logLevel: "info",
  define: {
    "globalThis.__STEVENS_LOCAL_DEEPL_API_KEY__": JSON.stringify(env.DEEPL_API_KEY ?? ""),
  },
};

const builds = [
  {
    ...shared,
    entryPoints: ["src/background/service-worker.js"],
    outfile: "dist/service-worker.js",
    format: "esm",
  },
  {
    ...shared,
    entryPoints: ["src/content/index.js"],
    outfile: "dist/content.js",
    format: "iife",
  },
  {
    ...shared,
    entryPoints: ["src/options/options.js"],
    outfile: "dist/options.js",
    format: "esm",
  },
  {
    ...shared,
    entryPoints: ["src/popup/popup.js"],
    outfile: "dist/popup.js",
    format: "esm",
  },
];

if (watch) {
  const ctxs = await Promise.all(builds.map((b) => esbuild.context(b)));
  await Promise.all(ctxs.map((c) => c.watch()));
  console.log("Watching for changes…");
} else {
  await Promise.all(builds.map((b) => esbuild.build(b)));
}

async function readEnvFile(path) {
  try {
    const content = await readFile(path, "utf8");
    return Object.fromEntries(
      content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const index = line.indexOf("=");
          if (index === -1) return [line, ""];
          return [line.slice(0, index), line.slice(index + 1)];
        })
    );
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}
