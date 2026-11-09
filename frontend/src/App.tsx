import { useState } from 'react'
import { Calculator, Sparkles } from 'lucide-react'
import { Asistente } from '@/components/Asistente'
import { CalculadoraRapida } from '@/components/CalculadoraRapida'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function App() {
  const [modo, setModo] = useState<'asistente' | 'calculadora'>('asistente')

  return (
    <main className="min-h-svh bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-100 px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="text-center">
          <Badge variant="secondary" className="mb-3">Presupuestando-ando</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Calcula el precio de tu web</h1>
          <p className="mt-2 text-slate-600">Explica tu proyecto con tus palabras o configúralo tú mismo.</p>
          <div className="mt-5 inline-flex gap-1 rounded-lg bg-white/70 p-1 ring-1 ring-foreground/10">
            <Button variant={modo === 'asistente' ? 'default' : 'ghost'} onClick={() => setModo('asistente')}>
              <Sparkles /> Asistente IA
            </Button>
            <Button variant={modo === 'calculadora' ? 'default' : 'ghost'} onClick={() => setModo('calculadora')}>
              <Calculator /> Calculadora rápida
            </Button>
          </div>
        </header>
        {modo === 'asistente' ? <Asistente /> : <CalculadoraRapida />}
      </div>
    </main>
  )
}

export default App
