import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center px-8">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Opportunity Dashboard
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Track professors, internships, scholarships, and job opportunities in
          one place.
        </p>

        {userId ? (
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-full bg-black px-8 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Go to dashboard →
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="inline-flex h-12 items-center justify-center rounded-full bg-black px-8 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign in
          </Link>
        )}
      </main>
    </div>
  );
}
