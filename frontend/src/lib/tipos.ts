export interface ServicioCatalogo {
  id: string
  nombre: string
  descripcion: string
  precio: number
  grupo?: 'base'
  unidad?: string
  min?: number
  max?: number
}

export interface ServicioPropuesto {
  id: string
  nombre: string
  descripcion: string
  justificacion: string
  cantidad: number | null
}

export interface Propuesta {
  resumen: string
  servicios: ServicioPropuesto[]
  dudas: string[]
  noIncluidos: string[]
}

// Respuesta de /api/presupuesto-final: todos los importes vienen del servidor
export interface PresupuestoFinal {
  cliente: string
  fecha: string
  resumen: string
  lineas: {
    id: string
    nombre: string
    descripcion: string
    cantidad: number
    unidad: string | null
    precioUnitario: number
    importe: number
  }[]
  total: number
  moneda: string
  aclaraciones: string[]
}

export const formatear = (cantidad: number, moneda = 'EUR') =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: moneda }).format(cantidad)
