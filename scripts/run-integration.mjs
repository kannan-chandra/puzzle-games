import { spawn } from "node:child_process";
import path from "node:path";
import { promises as fs } from "node:fs";

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`));
    });
  });
}

const puzzleSrcDir = path.resolve("tests/fixtures/puzzles");
const distDir = path.resolve("dist");
const serveRoot = path.resolve(".tmp/serve-root");
const serveSite = path.join(serveRoot, "puzzle-games");

try {
  await run("npm", ["run", "build"], { PUZZLE_SRC_DIR: puzzleSrcDir });
  await fs.rm(serveRoot, { recursive: true, force: true });
  await fs.mkdir(serveSite, { recursive: true });
  await fs.cp(distDir, serveSite, { recursive: true });
  await run("npx", ["playwright", "test"], { PW_SERVE_ROOT: serveRoot });
} catch (err) {
  console.error(err);
  process.exit(1);
}
