import Link from "next/link";
import { JSX, SVGProps } from "react";
import AuthButtons from "@/components/shared/AuthButtons";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full border-b">
        <div className="container mx-auto flex h-14 items-center px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center justify-center" href="#">
            <MountainIcon className="h-6 w-6" />
            <span className="sr-only">pagespace</span>
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <AuthButtons />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Collaborate, Innovate, and Create with pagespace
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  The ultimate platform for real-time collaboration and document
                  management.
                </p>
              </div>
              <div className="space-x-4">
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                  href="/dashboard"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything you need to succeed
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  pagespace provides a comprehensive suite of tools to help your
                  team collaborate effectively and manage your documents with
                  ease.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">Real-time Collaboration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Work together on documents in real-time, with changes synced
                  instantly across all devices.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">Advanced AI Features</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Leverage the power of AI to generate content, summarize text,
                  and more.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">Secure File Storage</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Keep your files safe and secure with our robust, local-first
                  file storage system.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t">
        <div className="container mx-auto flex flex-col gap-2 sm:flex-row py-6 shrink-0 items-center px-4 md:px-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 pagespace. All rights reserved.
          </p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Terms of Service
            </Link>
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function MountainIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}
