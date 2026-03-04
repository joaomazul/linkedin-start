import { AlertCircle, SearchX } from 'lucide-react'

interface FeedStateProps {
    title: string
    message: string
}

export function EmptyFeedState({ title, message }: FeedStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-14 text-center gap-3 border-2 border-dashed border-edge rounded-[var(--r-xl)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] bg-page mb-1">
                <SearchX size={24} className="text-ink-4" />
            </div>
            <h3 className="text-[16px] font-bold text-ink">{title}</h3>
            <p className="text-[13px] text-ink-4 max-w-[320px] leading-[1.65]">
                {message}
            </p>
        </div>
    )
}

export function ErrorState({ title = "Ops! Algo deu errado", message }: FeedStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-14 text-center gap-3 border-2 border-dashed border-danger-border rounded-[var(--r-xl)] bg-danger-bg">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] bg-white mb-1">
                <AlertCircle size={24} className="text-danger-text" />
            </div>
            <h3 className="text-[16px] font-bold text-danger-text">{title}</h3>
            <p className="text-[13px] text-danger-text/70 max-w-[320px] leading-[1.65]">
                {message || "Ocorreu um erro técnico ao processar sua solicitação. Verifique sua conexão ou tente novamente."}
            </p>
        </div>
    )
}
