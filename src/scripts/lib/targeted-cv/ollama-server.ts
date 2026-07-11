import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { writeArtifact, writeArtifactIf } from "./cache.ts";
import { artifactNames } from "./constants.ts";
import { StageError } from "./errors.ts";
import type { ManagedOllamaServer, ManagedOllamaServerOptions } from "./types.ts";

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function parseOllamaUrl(ollamaUrl: string): { url: URL; host: string } {
  const url = new URL(ollamaUrl);
  if (url.protocol !== "http:") {
    throw new Error("Ollama URL must use http:// for a local managed server.");
  }
  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error("Ollama URL must not include a path when managed automatically.");
  }
  return { url, host: `${url.hostname}:${url.port || "11434"}` };
}

async function isServerReady(ollamaUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer({
  ollamaUrl,
  child,
  cacheDir,
  getLogs,
}: {
  ollamaUrl: string;
  child: ChildProcessByStdio<null, Readable, Readable>;
  cacheDir: string;
  getLogs: () => string;
}): Promise<void> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      await writeArtifact(cacheDir, artifactNames.ollamaServerLog, getLogs());
      throw new StageError("parse", `Managed Ollama server exited before it became ready. See ${artifactNames.ollamaServerLog} in the cache directory.`, { cacheDir });
    }
    if (await isServerReady(ollamaUrl)) return;
    await sleep(250);
  }
  await writeArtifact(cacheDir, artifactNames.ollamaServerLog, getLogs());
  throw new StageError("parse", `Managed Ollama server did not become ready in time. See ${artifactNames.ollamaServerLog} in the cache directory.`, { cacheDir });
}

export async function startManagedOllamaServer({
  ollamaUrl,
  cacheDir,
  verbose = false,
  log,
}: ManagedOllamaServerOptions): Promise<ManagedOllamaServer> {
  const { host } = parseOllamaUrl(ollamaUrl);

  if (await isServerReady(ollamaUrl)) {
    if (verbose) log?.(`[ollama] Reusing existing server at ${host}`);
    return {
      async stop() {
        await writeArtifactIf(verbose, cacheDir, artifactNames.ollamaServerLog, `Reused existing Ollama server at ${host}\n`);
      },
    };
  }

  let logBuffer = "";
  let spawnError: Error | undefined;
  const child = spawn("ollama", ["serve"], {
    env: { ...process.env, OLLAMA_HOST: host },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.once("error", (error) => {
    spawnError = error;
  });

  child.stdout.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    logBuffer += text;
    if (verbose) log?.(`[ollama] ${text.trimEnd()}`);
  });

  child.stderr.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    logBuffer += text;
    if (verbose) log?.(`[ollama] ${text.trimEnd()}`);
  });

  try {
    await waitForServer({ ollamaUrl, child, cacheDir, getLogs: () => logBuffer });
  } catch (error) {
    child.kill("SIGTERM");
    if (spawnError) {
      await writeArtifact(cacheDir, artifactNames.ollamaServerLog, logBuffer);
      throw new StageError("parse", `Failed to start managed Ollama server: ${spawnError.message}. See ${artifactNames.ollamaServerLog} in the cache directory.`, {
        cacheDir,
        cause: spawnError,
      });
    }
    throw error;
  }

  return {
    async stop() {
      if (child.exitCode === null) {
        child.kill("SIGTERM");
        await new Promise<void>((resolve) => {
          child.once("exit", () => resolve());
          setTimeout(resolve, 2_000);
        });
      }
      await writeArtifact(cacheDir, artifactNames.ollamaServerLog, logBuffer);
    },
  };
}
