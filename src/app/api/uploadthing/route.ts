import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "@/shared/lib/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
});
