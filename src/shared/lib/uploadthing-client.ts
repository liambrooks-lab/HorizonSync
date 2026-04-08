"use client";

import { generateReactHelpers } from "@uploadthing/react";

import type { OurFileRouter } from "@/shared/lib/uploadthing";

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>({
  url: "/api/uploadthing",
});
