import "dotenv/config";
import { runSeed } from "./server/seed.ts";

console.log("Running seed...");
try {
  await runSeed();
  console.log("Seed complete!");
  process.exit(0);
} catch (e) {
  console.error("Seed failed:", e);
  process.exit(1);
}
