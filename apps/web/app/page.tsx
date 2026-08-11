import PrototypeFrame from "./prototype-frame";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const requestedView = (await searchParams).view ?? "start";
  const initialView = /^[a-z0-9-]+$/.test(requestedView)
    ? requestedView
    : "start";
  return <PrototypeFrame initialView={initialView} />;
}
