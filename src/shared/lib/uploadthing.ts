import { getToken } from "next-auth/jwt";
import { UploadThingError } from "uploadthing/server";
import { createUploadthing } from "uploadthing/next";

import { db } from "@/shared/lib/db";

const f = createUploadthing();

export const ourFileRouter = {
  avatarUploader: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "4MB",
    },
  })
    .middleware(async ({ req }) => {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token?.sub) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: token.sub };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Avatar uploads are persisted immediately so the user's latest image
      // is available everywhere, even before the rest of the form is saved.
      await db.user.update({
        where: { id: metadata.userId },
        data: { image: file.ufsUrl },
      });

      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
  chatAttachmentUploader: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "8MB",
    },
    pdf: {
      maxFileCount: 1,
      maxFileSize: "16MB",
    },
    text: {
      maxFileCount: 1,
      maxFileSize: "4MB",
    },
    blob: {
      maxFileCount: 1,
      maxFileSize: "16MB",
    },
  })
    .middleware(async ({ req }) => {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token?.sub) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: token.sub };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    }),
  postMediaUploader: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "8MB",
    },
    pdf: {
      maxFileCount: 1,
      maxFileSize: "16MB",
    },
  })
    .middleware(async ({ req }) => {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token?.sub) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: token.sub };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    }),
  documentAssetUploader: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "16MB",
    },
    pdf: {
      maxFileCount: 1,
      maxFileSize: "16MB",
    },
    text: {
      maxFileCount: 1,
      maxFileSize: "8MB",
    },
    blob: {
      maxFileCount: 1,
      maxFileSize: "16MB",
    },
  })
    .middleware(async ({ req }) => {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token?.sub) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: token.sub };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    }),
};

export type OurFileRouter = typeof ourFileRouter;
