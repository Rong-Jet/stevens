import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const shared = {
  bundle: true,
  platform: "browser",
  target: "chrome114",
  logLevel: "info",
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
