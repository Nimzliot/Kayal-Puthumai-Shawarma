import { AppShell } from "@/components/app-shell";
import { LoginPage } from "@/components/auth/login-page";

type PageProps = {
  searchParams?: Promise<{
    mode?: string;
    next?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const mode = params?.mode;
  const nextPath = params?.next?.startsWith("/") ? params.next : "/";

  return (
    <AppShell>
      <LoginPage
        initialMode={
          mode === "signup" || mode === "forgot" || mode === "update-password" ? mode : "login"
        }
        nextPath={nextPath}
      />
    </AppShell>
  );
}
