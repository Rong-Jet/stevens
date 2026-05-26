import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const DEFAULT_VALUES = {
  DEEPL_API_KEY: "",
};

export async function createEnvFile({
  examplePath = ".env.example",
  envPath = ".env",
  values,
  overwrite = false,
} = {}) {
  if (!overwrite && await exists(envPath)) {
    throw new Error(`${envPath} already exists. Pass --force to overwrite it.`);
  }

  const example = await readFile(examplePath, "utf8");
  const merged = { ...DEFAULT_VALUES, ...values };
  const content = example
    .split("\n")
    .map((line) => replaceEnvLine(line, merged))
    .join("\n");

  await writeFile(envPath, content, { mode: 0o600 });
}

function replaceEnvLine(line, values) {
  const match = line.match(/^([A-Z0-9_]+)=/);
  if (!match) return line;

  const key = match[1];
  if (!(key in values)) return line;

  return `${key}=${values[key]}`;
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (arg === "--force") {
      acc.force = true;
      return acc;
    }

    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      acc[match[1]] = match[2];
    }
    return acc;
  }, {});
}

async function promptForMissingValues(args) {
  const rl = createInterface({ input, output });
  try {
    const apiKey = args["api-key"] ?? await rl.question("DeepL API key: ");

    return {
      DEEPL_API_KEY: apiKey.trim(),
    };
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const values = await promptForMissingValues(args);

  await createEnvFile({
    examplePath: resolve(".env.example"),
    envPath: resolve(".env"),
    values,
    overwrite: Boolean(args.force),
  });

  console.log("Created .env from .env.example.");
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
