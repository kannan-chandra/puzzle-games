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

let failure = null;

try {
  await run("npm", ["run", "build"], { PUZZLE_SRC_DIR: puzzleSrcDir });
  await run("npx", ["playwright", "test"], { PW_SERVE_ROOT: distDir });
} catch (err) {
  failure = err;
} finally {
  try {
    // Restore production puzzle outputs after fixture-based integration tests.
    await run("npm", ["run", "gen:puzzles"]);
  } catch (restoreErr) {
    if (!failure) {
      failure = restoreErr;
    } else {
      console.error("Failed to restore puzzle outputs:", restoreErr);
    }
  }
}

if (failure) {
  console.error(failure);
  process.exit(1);
}
