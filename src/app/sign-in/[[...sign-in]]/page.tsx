"use client";

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-page relative overflow-hidden p-6">
            {/* Background Ornaments */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand/5 blur-[160px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[140px] rounded-full" />

            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="mb-10 text-center space-y-3">
                    <h1 className="text-[15px] font-bold text-ink text-5xl tracking-tighter">LinkedFlow</h1>
                    <p className="lf-body text-ink-3">The Intelligence Layer for LinkedIn Power Users.</p>
                </div>

                <div className="bg-white p-2 rounded-lg border border-edge shadow-2xl shadow-black">
                    <SignIn appearance={{
                        elements: {
                            card: "bg-transparent shadow-none border-none",
                            headerTitle: "text-[15px] font-bold text-ink text-2xl",
                            headerSubtitle: "lf-body text-ink-3",
                            formButtonPrimary: "bg-brand hover:bg-brand-dark text-white lf-subtitle font-bold rounded-lg border-none",
                            socialButtonsBlockButton: "bg-page border-edge hover:bg-hover text-ink lf-body-sm rounded-lg",
                            socialButtonsBlockButtonText: "lf-body-sm font-bold",
                            formFieldLabel: "lf-label text-ink-4 font-bold uppercase",
                            formFieldInput: "bg-page border-edge text-ink lf-body-sm rounded-lg h-11",
                            footerActionLink: "text-brand hover:text-brand2 lf-body-sm font-bold"
                        }
                    }} />
                </div>
            </div>
        </div>
    )
}
