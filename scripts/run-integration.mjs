import { spawn } from "node:child_process";
import path from "node:path";

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

try {
  await run("npm", ["run", "build"], { PUZZLE_SRC_DIR: puzzleSrcDir });
  await run("npx", ["playwright", "test"], { PW_SERVE_ROOT: distDir });
} catch (err) {
  console.error(err);
  process.exit(1);
}
