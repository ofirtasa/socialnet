import "dotenv/config";
import { runSeed } from "./server/seed";

async function main() {
  console.log("🌱 Starting seed runner...");
  try {
    await runSeed();
    console.log("✅ Seed complete!");
    process.exit(0);
  } catch (e) {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  }
}

main();
