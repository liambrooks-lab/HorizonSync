"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/shared/lib/db";
import { slugify } from "@/shared/lib/utils";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

type RegisterActionState = {
  error: string | null;
  success: string | null;
};

async function generateUniqueUsername(name: string) {
  const base = slugify(name) || "horizonsync-user";
  let suffix = 0;

  while (true) {
    const username = suffix === 0 ? base : `${base}-${suffix}`;
    const existingUser = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existingUser) {
      return username;
    }

    suffix += 1;
  }
}

export async function registerUserAction(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const parsedValues = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedValues.success) {
    return {
      error: parsedValues.error.issues[0]?.message ?? "Please check the form values.",
      success: null,
    };
  }

  const existingUser = await db.user.findUnique({
    where: { email: parsedValues.data.email },
    select: { id: true, passwordHash: true },
  });

  if (existingUser?.passwordHash) {
    return {
      error: "An account with this email already exists.",
      success: null,
    };
  }

  if (existingUser && !existingUser.passwordHash) {
    return {
      error: "This email already belongs to a social sign-in account. Please use that provider.",
      success: null,
    };
  }

  const passwordHash = await bcrypt.hash(parsedValues.data.password, 12);

  await db.user.create({
    data: {
      name: parsedValues.data.name,
      email: parsedValues.data.email,
      passwordHash,
      username: await generateUniqueUsername(parsedValues.data.name),
      socialLinks: ["", "", "", ""],
    },
  });

  return {
    error: null,
    success: "Account created. You can sign in now with your credentials.",
  };
}
