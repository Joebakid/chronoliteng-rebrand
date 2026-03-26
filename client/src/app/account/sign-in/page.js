import { Suspense } from "react";
import BackHomeButton from "@/components/BackHomeButton";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Sign In | Chronolite",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* CRITICAL: The entire content area is wrapped in Suspense.
        This fixes the Vercel build error because both BackHomeButton 
        and AuthForm rely on client-side search parameters.
      */}
      <Suspense fallback={null}>
        <div className="site-frame mb-4 flex justify-end sm:mb-6">
          <BackHomeButton />
        </div>
        
        <div className="flex flex-1 items-center justify-center">
          <AuthForm mode="login" />
        </div>
      </Suspense>
    </main>
  );
}