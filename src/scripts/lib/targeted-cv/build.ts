import { spawn } from "node:child_process";
import { StageError } from "./errors.ts";

export async function runAstroBuild(cacheDir: string, verbose = false): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      stdio: verbose ? "inherit" : "pipe",
      env: process.env,
    });

    if (!verbose) {
      child.stdout?.on("data", () => {});
    }

    let stderr = "";
    if (!verbose) {
      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new StageError("build", "Astro build failed for the targeted CV variant.", { cacheDir, cause: stderr }));
    });
  });
}
