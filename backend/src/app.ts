import express, { urlencoded } from "express";
import cors from "cors";
import { env } from "./config/config.js";
import { handleError } from "./error/handleError.js";
import { notFoundRoute } from "./routes/notFoundRoute.js";
import { apiRouter } from "./routes/apiRoute.js";
import cookieParser from "cookie-parser";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: "https://banking-app-803ad.web.app",
      credentials: true,
    }),
  );
  app.use(urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api", apiRouter);
  app.use(notFoundRoute);
  app.use(handleError);

  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}
