import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  Download,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { crearPdf, nombreArchivo } from '@/lib/pdf'
import { formatear, type PresupuestoFinal, type Propuesta, type ServicioCatalogo } from '@/lib/tipos'

const MAX_DESCRIPCION = 2000
const EJEMPLO =
  'Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas.'

const claseTextarea =
  'w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

type Paso = 'solicitud' | 'revision' | 'presupuesto'

interface Seleccion {
  id: string
  justificacion: string
  cantidad: string // texto del input; el servidor valida el número
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
  return data as T
}

export function Asistente() {
  const [paso, setPaso] = useState<Paso>('solicitud')
  const [catalogo, setCatalogo] = useState<ServicioCatalogo[]>([])
  const [cliente, setCliente] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [resumen, setResumen] = useState('')
  const [seleccion, setSeleccion] = useState<Seleccion[]>([])
  const [aclaraciones, setAclaraciones] = useState('')
  const [nuevo, setNuevo] = useState<string | null>(null)

  const [presupuesto, setPresupuesto] = useState<PresupuestoFinal | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/catalogo')
      .then((r) => r.json())
      .then((d) => setCatalogo(d.servicios))
      .catch(() => setError('No se pudo cargar el catálogo de servicios.'))
  }, [])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const porId = useMemo(() => new Map(catalogo.map((s) => [s.id, s])), [catalogo])

  // Comprobaciones locales para guiar al usuario (el servidor vuelve a validar)
  const faltan = useMemo(() => {
    const avisos: string[] = []
    const bases = seleccion.filter((s) => porId.get(s.id)?.grupo === 'base').length
    if (bases !== 1) avisos.push('Elige exactamente un tipo de web (Landing page o Web corporativa).')
    for (const s of seleccion) {
      const c = porId.get(s.id)
      if (c?.unidad) {
        const n = Number(s.cantidad)
        if (!Number.isInteger(n) || n < (c.min ?? 1) || n > (c.max ?? 1)) {
          avisos.push(`Indica la cantidad de "${c.nombre}" (entre ${c.min} y ${c.max}).`)
        }
      }
    }
    return avisos
  }, [seleccion, porId])

  async function pedirPropuesta(e?: FormEvent) {
    e?.preventDefault()
    setCargando(true)
    setError(null)
    try {
      const p = await postJson<Propuesta>('/api/propuesta', { cliente, descripcion })
      setResumen(p.resumen)
      setSeleccion(p.servicios.map((s) => ({ id: s.id, justificacion: s.justificacion, cantidad: s.cantidad?.toString() ?? '' })))
      setAclaraciones([...p.dudas, ...p.noIncluidos.map((n) => `Pendiente de valorar: ${n}`)].join('\n'))
      setPaso('revision')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCargando(false)
    }
  }

  async function calcular() {
    setCargando(true)
    setError(null)
    try {
      const p = await postJson<PresupuestoFinal>('/api/presupuesto-final', {
        cliente,
        resumen,
        servicios: seleccion.map((s) => (porId.get(s.id)?.unidad ? { id: s.id, cantidad: Number(s.cantidad) } : { id: s.id })),
        aclaraciones: aclaraciones.split('\n'),
      })
      setPresupuesto(p)
      setPreviewUrl(null)
      setPaso('presupuesto')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCargando(false)
    }
  }

  function anadir() {
    if (!nuevo) return
    setSeleccion((s) => [...s, { id: nuevo, justificacion: 'Añadido manualmente.', cantidad: '' }])
    setNuevo(null)
  }

  const disponibles = catalogo
    .filter((c) => !seleccion.some((s) => s.id === c.id))
    .map((c) => ({ value: c.id, label: `${c.nombre} (${formatear(c.precio)}${c.unidad ? ` / ${c.unidad}` : ''})` }))

  const alerta = error && (
    <Alert variant="destructive" className="border-red-300 bg-red-50">
      <AlertCircle />
      <AlertTitle>Algo ha fallado</AlertTitle>
      <AlertDescription>
        {error}
        {paso === 'solicitud' && descripcion.trim() && (
          <Button variant="outline" size="sm" className="mt-2" onClick={() => pedirPropuesta()} disabled={cargando}>
            <RotateCcw /> Reintentar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )

  if (paso === 'solicitud') {
    return (
      <Card className="mx-auto max-w-2xl shadow-xl shadow-indigo-100">
        <form onSubmit={pedirPropuesta}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-indigo-600" /> Cuéntanos tu proyecto
            </CardTitle>
            <CardDescription>La IA te propondrá servicios de nuestro catálogo. Podrás revisarlos antes del presupuesto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente o empresa</Label>
              <Input id="cliente" maxLength={100} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Restaurante La Prueba SL" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">¿Qué necesitas?</Label>
              <textarea
                id="descripcion"
                rows={6}
                maxLength={MAX_DESCRIPCION}
                className={claseTextarea}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={EJEMPLO}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <button type="button" className="underline" onClick={() => setDescripcion(EJEMPLO)}>
                  Usar ejemplo
                </button>
                <span>
                  {descripcion.length}/{MAX_DESCRIPCION}
                </span>
              </div>
            </div>
            {alerta}
          </CardContent>
          <CardFooter className="mt-6">
            <Button type="submit" size="lg" className="w-full" disabled={cargando}>
              {cargando ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {cargando ? 'Analizando tu solicitud…' : 'Obtener propuesta'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  if (paso === 'revision') {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="shadow-xl shadow-indigo-100">
          <CardHeader>
            <CardTitle>Revisa la propuesta para {cliente}</CardTitle>
            <CardDescription>Quita, añade o ajusta servicios. Los importes los calcula el servidor al confirmar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="resumen">Resumen del proyecto</Label>
              <textarea id="resumen" rows={3} maxLength={1000} className={claseTextarea} value={resumen} onChange={(e) => setResumen(e.target.value)} />
            </div>

            <div className="space-y-3">
              <Label>Servicios propuestos</Label>
              {seleccion.length === 0 && <p className="text-sm text-muted-foreground">No hay servicios seleccionados.</p>}
              {seleccion.map((s, i) => {
                const c = porId.get(s.id)
                if (!c) return null
                return (
                  <div key={s.id} className="flex gap-3 rounded-lg border bg-white/60 p-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{c.nombre}</span>
                        <Badge variant="secondary">
                          {formatear(c.precio)}
                          {c.unidad && ` / ${c.unidad}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.descripcion}</p>
                      <p className="text-sm text-indigo-700">{s.justificacion}</p>
                      {c.unidad && (
                        <div className="flex items-center gap-2 pt-1">
                          <Label htmlFor={`cant-${s.id}`} className="text-xs">
                            Nº de {c.unidad}s
                          </Label>
                          <Input
                            id={`cant-${s.id}`}
                            type="number"
                            min={c.min}
                            max={c.max}
                            className="h-8 w-20"
                            value={s.cantidad}
                            onChange={(e) =>
                              setSeleccion((sel) => sel.map((x, j) => (j === i ? { ...x, cantidad: e.target.value } : x)))
                            }
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Quitar ${c.nombre}`}
                      onClick={() => setSeleccion((sel) => sel.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="text-red-600" />
                    </Button>
                  </div>
                )
              })}

              {disponibles.length > 0 && (
                <div className="flex gap-2">
                  <Select items={disponibles} value={nuevo} onValueChange={(v) => setNuevo(v as string)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Añadir servicio del catálogo…" />
                    </SelectTrigger>
                    <SelectContent>
                      {disponibles.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={anadir} disabled={!nuevo}>
                    <Plus /> Añadir
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aclaraciones">Dudas y aspectos pendientes (una por línea)</Label>
              <textarea id="aclaraciones" rows={4} className={claseTextarea} value={aclaraciones} onChange={(e) => setAclaraciones(e.target.value)} />
            </div>

            {faltan.length > 0 && (
              <Alert className="border-amber-300 bg-amber-50">
                <AlertCircle />
                <AlertTitle>Faltan datos para calcular</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {faltan.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {alerta}
          </CardContent>
          <CardFooter className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => { setError(null); setPaso('solicitud') }}>
              <ArrowLeft /> Cambiar solicitud
            </Button>
            <Button className="flex-1" onClick={calcular} disabled={cargando || faltan.length > 0}>
              {cargando ? <Loader2 className="animate-spin" /> : <Calculator />}
              Confirmar y calcular
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // paso === 'presupuesto'
  const p = presupuesto!
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="overflow-hidden shadow-xl shadow-indigo-100">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-600 pb-6 text-white">
          <CardDescription className="text-indigo-100">Presupuesto para {p.cliente}</CardDescription>
          <CardTitle className="text-4xl font-bold">{formatear(p.total, p.moneda)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {p.resumen && <p className="text-sm text-slate-700">{p.resumen}</p>}
          <Separator />
          {p.lineas.map((l) => (
            <div key={l.id} className="flex justify-between gap-4 text-sm">
              <span>
                {l.nombre}
                {l.unidad && <span className="text-muted-foreground"> × {l.cantidad}</span>}
              </span>
              <span className="font-medium">{formatear(l.importe, p.moneda)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatear(p.total, p.moneda)}</span>
          </div>
          {p.aclaraciones.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm">
              <p className="font-medium">Pendiente de concretar</p>
              <ul className="list-disc pl-4 text-slate-700">
                {p.aclaraciones.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPaso('revision')}>
            <ArrowLeft /> Modificar servicios
          </Button>
          <Button className="flex-1" onClick={() => setPreviewUrl(URL.createObjectURL(crearPdf(p).output('blob')))}>
            <Eye /> Previsualizar PDF
          </Button>
        </CardFooter>
      </Card>

      {previewUrl && (
        <Card className="shadow-xl shadow-indigo-100">
          <CardHeader>
            <CardTitle>Vista previa del documento</CardTitle>
            <CardDescription>Revisa el contenido. Si todo es correcto, acéptalo para descargarlo.</CardDescription>
          </CardHeader>
          <CardContent>
            <iframe title="Vista previa del presupuesto" src={previewUrl} className="h-[70vh] w-full rounded-lg border" />
          </CardContent>
          <CardFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setPreviewUrl(null)}>
              Cerrar vista previa
            </Button>
            <Button className="flex-1" onClick={() => crearPdf(p).save(nombreArchivo(p))}>
              <Download /> Aceptar y descargar PDF
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
