import { notFound } from "next/navigation";

import { ProfileHeader } from "@/modules/profile/components/ProfileHeader";
import { db } from "@/shared/lib/db";

type ProfilePageProps = {
  params: {
    username: string;
  };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = await db.user.findUnique({
    where: { username: params.username },
  });

  if (!profile) {
    notFound();
  }

  return (
    <ProfileHeader
      bio={profile.bio}
      image={profile.image}
      name={profile.name ?? "HorizonSync User"}
      username={profile.username ?? params.username}
    />
  );
}
