import app from "./app";
import dbConnection from "./configs/db";

import { env } from "./configs/env";
import { seedAdmins } from "./seeders/seedAdmin";

async function startServer() {
  await dbConnection;

  try {
    await seedAdmins();
  } catch (err) {
    console.error("Admin seeding failed:", err);
  }

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(
      `Server is running on ${env.NODE_ENV === "production" ? "https://api.njerka.xyz" : `http://localhost:${env.PORT}`} in ${env.NODE_ENV} mode`,
    );
  });
}

startServer();
