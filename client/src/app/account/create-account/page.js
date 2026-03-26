import { Suspense } from "react";
import BackHomeButton from "@/components/BackHomeButton";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Create Account | Chronolite",
};

export default function CreateAccountPage() {
  return (
    <main className="flex min-h-[100dvh] w-full flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {/* We wrap the entire functional area in Suspense because both 
          BackHomeButton and AuthForm likely use useSearchParams() 
      */}
      <Suspense fallback={null}>
        <div className="site-frame mb-6 flex justify-end">
          <BackHomeButton />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <AuthForm mode="register" />
        </div>
      </Suspense>
    </main>
  );
}