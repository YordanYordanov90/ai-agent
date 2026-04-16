import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10">
      <SignUp
        fallbackRedirectUrl="/"
        appearance={{
          theme: dark,
        }}
      />
    </main>
  );
}
