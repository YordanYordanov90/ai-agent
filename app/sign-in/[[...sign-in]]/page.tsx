import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10">
      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          theme: dark,
        }}
      />
    </main>
  );
}
