import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { ClerkProvider } from '@clerk/nextjs'
// import { dark } from '@clerk/themes'

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LinkedFlow",
  description: "LinkedIn Content & Engagement Flow",
};

import { KeyboardShortcutsProvider } from "@/components/providers/KeyboardShortcutsProvider";
import { OnboardingGuard } from "@/components/providers/OnboardingGuard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read directly from process.env to avoid env.ts throwing during prerender
  const defaultAccountId = process.env.UNIPILE_LINKEDIN_ACCOUNT_ID || ''

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#3760D6',
          borderRadius: '0.75rem',
          fontFamily: urbanist.style.fontFamily,
        },
      }}
      signInFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      signUpFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
    >
      <html lang="pt-BR">
        <body
          className={`${urbanist.variable} font-sans bg-page text-ink antialiased`}
        >
          <TooltipProvider>
            <Providers>
              <KeyboardShortcutsProvider>
                <OnboardingGuard defaultAccountId={defaultAccountId}>
                  {children}
                </OnboardingGuard>
              </KeyboardShortcutsProvider>
            </Providers>
            <Toaster position="bottom-right" theme="light" closeButton />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
