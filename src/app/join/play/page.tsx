import { PlayScreen } from "./play-screen";

export const metadata = { title: "قافلة اللبان" };

export default async function PlayPage({ searchParams }: PageProps<"/join/play">) {
  const { s } = await searchParams;
  return <PlayScreen sessionId={typeof s === "string" ? s : ""} />;
}
