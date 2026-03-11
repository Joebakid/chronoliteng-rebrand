import { Suspense } from "react";
import BackHomeButton from "@/components/BackHomeButton";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Create Account",
};

export default function CreateAccountPage() {
  return (
    <main className="flex min-h-[100dvh] w-full flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="site-frame mb-6 flex justify-end">
        <BackHomeButton />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Suspense fallback={null}>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </main>
  );
}