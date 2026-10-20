import { useState, type FormEvent } from 'react'
import { AlertCircle, Calculator, FileText, Globe, Languages, Loader2, Mail } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

const API_URL = 'http://localhost:3000/api/presupuesto'

type TipoWeb = 'landing' | 'corporativa'

interface Presupuesto {
  base: number
  paginasAdicionales: number
  formulario: number
  segundoIdioma: number
  total: number
  moneda: string
}

const TIPOS = [
  { value: 'landing', label: 'Landing page' },
  { value: 'corporativa', label: 'Web corporativa' },
]

const formatear = (cantidad: number, moneda = 'EUR') =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: moneda }).format(cantidad)

function App() {
  const [tipo, setTipo] = useState<TipoWeb>('landing')
  const [paginas, setPaginas] = useState('1')
  const [formulario, setFormulario] = useState(false)
  const [segundoIdioma, setSegundoIdioma] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    setPresupuesto(null)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Se envía el número tal cual: la validación la hace el backend
        body: JSON.stringify({ tipo, paginas: Number(paginas), formulario, segundoIdioma }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`)
      } else {
        setPresupuesto(data)
      }
    } catch {
      setError('No se pudo conectar con el servidor. ¿Está el backend arrancado en el puerto 3000?')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="min-h-svh bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-100 px-4 py-12">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.1fr_1fr] md:items-start">
        <header className="md:col-span-2 text-center">
          <Badge variant="secondary" className="mb-3">Presupuestador web</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Calcula el precio de tu web
          </h1>
          <p className="mt-2 text-slate-600">Configura tu proyecto y obtén un presupuesto al instante.</p>
        </header>

        <Card className="shadow-xl shadow-indigo-100">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5 text-indigo-600" /> Tu proyecto
              </CardTitle>
              <CardDescription>Elige el tipo de web y los extras que necesitas.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de web</Label>
                <Select items={TIPOS} value={tipo} onValueChange={(v) => setTipo(v as TipoWeb)}>
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paginas">Número de páginas</Label>
                <Input
                  id="paginas"
                  type="number"
                  min={1}
                  max={20}
                  value={paginas}
                  onChange={(e) => setPaginas(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">La primera página está incluida. Máximo 20.</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-white/60 p-4">
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-indigo-600" />
                  <div>
                    <Label htmlFor="formulario">Formulario de contacto</Label>
                    <p className="text-xs text-muted-foreground">+80 €</p>
                  </div>
                </div>
                <Switch id="formulario" checked={formulario} onCheckedChange={setFormulario} />
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-white/60 p-4">
                <div className="flex items-center gap-3">
                  <Languages className="size-5 text-indigo-600" />
                  <div>
                    <Label htmlFor="idioma">Segundo idioma</Label>
                    <p className="text-xs text-muted-foreground">+150 €</p>
                  </div>
                </div>
                <Switch id="idioma" checked={segundoIdioma} onCheckedChange={setSegundoIdioma} />
              </div>
            </CardContent>

            <CardFooter className="mt-6">
              <Button type="submit" size="lg" className="w-full" disabled={cargando}>
                {cargando ? <Loader2 className="animate-spin" /> : <Calculator />}
                Calcular presupuesto
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-300 bg-red-50">
              <AlertCircle />
              <AlertTitle>Error en la solicitud</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {presupuesto ? (
            <Card className="overflow-hidden shadow-xl shadow-indigo-100">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-600 pb-6 text-white">
                <CardDescription className="text-indigo-100">Total estimado</CardDescription>
                <CardTitle className="text-4xl font-bold">
                  {formatear(presupuesto.total, presupuesto.moneda)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Linea label="Base" valor={presupuesto.base} moneda={presupuesto.moneda} />
                <Linea label="Páginas adicionales" valor={presupuesto.paginasAdicionales} moneda={presupuesto.moneda} />
                <Linea label="Formulario de contacto" valor={presupuesto.formulario} moneda={presupuesto.moneda} />
                <Linea label="Segundo idioma" valor={presupuesto.segundoIdioma} moneda={presupuesto.moneda} />
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatear(presupuesto.total, presupuesto.moneda)}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            !error && (
              <Card className="border-dashed bg-white/50">
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                  <FileText className="size-10 opacity-50" />
                  <p>Tu presupuesto aparecerá aquí.</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </main>
  )
}

function Linea({ label, valor, moneda }: { label: string; valor: number; moneda: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={valor === 0 ? 'text-muted-foreground' : 'font-medium'}>{formatear(valor, moneda)}</span>
    </div>
  )
}

export default App
