"use server";

import { z } from "zod";

import { getCurrentUser } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import {
  sanitizeOptionalPlainText,
  sanitizePlainText,
} from "@/shared/lib/security";

const socialLinkSchema = z
  .string()
  .trim()
  .max(255)
  .refine(
    (value) => value.length === 0 || /^https?:\/\//i.test(value),
    "Social links must be valid absolute URLs.",
  );

const profileSettingsSchema = z.object({
  image: z.string().trim().optional().default(""),
  name: z.string().trim().min(2).max(80).transform((value) => sanitizePlainText(value, 80)),
  bio: z.string().trim().max(280).optional().default(""),
  region: z.string().trim().max(80).optional().default(""),
  socialLinks: z.tuple([
    socialLinkSchema,
    socialLinkSchema,
    socialLinkSchema,
    socialLinkSchema,
  ]),
});

export type ProfileActionState = {
  error: string | null;
  success: string | null;
};

export async function updateProfileSettingsAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: "Your session has expired. Please sign in again.",
      success: null,
    };
  }

  const parsedValues = profileSettingsSchema.safeParse({
    image: formData.get("image"),
    name: formData.get("name"),
    bio: formData.get("bio"),
    region: formData.get("region"),
    socialLinks: [
      formData.get("socialLink0"),
      formData.get("socialLink1"),
      formData.get("socialLink2"),
      formData.get("socialLink3"),
    ],
  });

  if (!parsedValues.success) {
    return {
      error: parsedValues.error.issues[0]?.message ?? "Please check the form values.",
      success: null,
    };
  }

  await db.user.update({
    where: { id: currentUser.id },
    data: {
      image: parsedValues.data.image || currentUser.image,
      name: parsedValues.data.name,
      bio: sanitizeOptionalPlainText(parsedValues.data.bio, 280),
      region: sanitizeOptionalPlainText(parsedValues.data.region, 80),
      socialLinks: parsedValues.data.socialLinks.map((link) => link.trim()),
    },
  });

  return {
    error: null,
    success: "Profile settings updated successfully.",
  };
}
