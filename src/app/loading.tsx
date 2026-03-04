import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-page">
            <Loader2 className="animate-spin text-brand" size={32} />
        </div>
    )
}
