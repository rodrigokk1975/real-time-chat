import { createServerBundle } from "./bootstrap.js";
import { env } from "./config/env.js";

const { httpServer } = createServerBundle();

httpServer.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});
