import LoginClient from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ registered?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const registered = sp.registered === "1";

  return <LoginClient registered={registered} />;
}
