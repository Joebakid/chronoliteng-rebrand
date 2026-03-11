import { Suspense } from "react";
import BackHomeButton from "@/components/BackHomeButton";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="site-frame mb-4 flex justify-end sm:mb-6">
        <BackHomeButton />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}
