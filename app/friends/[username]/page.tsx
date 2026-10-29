import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FriendProfile } from "@/components/friends/friend-profile";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const friend = allPeople.find((person) => person.username === username);
  return { title: friend ? `${friend.name} — Solace` : "Профиль не найден — Solace" };
}

export default async function FriendProfilePage({ params }: Props) {
  const { username } = await params;
  const friend = allMockPeople.find((person) => person.username === username);

  if (!friend) notFound();

  return <FriendProfile friend={friend} />;
}
