import { redirect } from "next/navigation";

import { getSession } from "@/shared/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  redirect(session ? "/global" : "/login");
}
