import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-page font-instrument">
            <div className="text-center space-y-6">
                <h1 className="lf-display text-8xl text-brand/50">404</h1>
                <div>
                    <h2 className="text-[15px] font-bold text-ink text-2xl">Página não encontrada</h2>
                    <p className="lf-body text-ink-3 mt-2">A página que você está procurando não existe ou foi movida.</p>
                </div>
                <Link href="/">
                    <Button variant="outline" className="mt-4 border-edge text-ink hover:bg-white rounded-r-sm">
                        Voltar ao Início
                    </Button>
                </Link>
            </div>
        </div>
    )
}
