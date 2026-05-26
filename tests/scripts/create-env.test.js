import { describe, it, expect } from "@jest/globals";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createEnvFile } from "../../scripts/create-env.js";

describe("createEnvFile", () => {
  it("should create .env from .env.example with only the provided api key", async () => {
    const dir = await mkdtemp(join(tmpdir(), "stevens-env-"));
    const examplePath = join(dir, ".env.example");
    const envPath = join(dir, ".env");

    await writeFile(examplePath, "DEEPL_API_KEY=\n");

    await createEnvFile({
      examplePath,
      envPath,
      values: {
        DEEPL_API_KEY: "secret-key:fx",
      },
    });

    await expect(readFile(envPath, "utf8")).resolves.toBe("DEEPL_API_KEY=secret-key:fx\n");
  });
});
