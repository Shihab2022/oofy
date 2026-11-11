import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { seedAdmin } from "./controllers/auth.controller";

const port = Number(process.env.PORT) || 5000;
async function bootstrap() {
  try { await seedAdmin(); }
  catch (error: any) { console.warn("Admin seed skipped:", error.message); }
  app.listen(port, () => console.log(`OOFY backend running on port ${port}`));
}
bootstrap().catch(error => { console.error("Failed to start server:", error); process.exit(1); });
