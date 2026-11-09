import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatear, type PresupuestoFinal } from './tipos'

const MARGEN = 18
const INDIGO: [number, number, number] = [79, 70, 229]

// Las fuentes estándar de jsPDF no tienen espacios Unicode especiales
const euros = (n: number, moneda: string) => formatear(n, moneda).replace(/\s/g, ' ')

// Genera el PDF SOLO con los datos devueltos por el servidor
export function crearPdf(p: PresupuestoFinal): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const ancho = doc.internal.pageSize.getWidth()
  const util = ancho - MARGEN * 2
  const fecha = new Date(p.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  // Cabecera
  doc.setFillColor(...INDIGO)
  doc.rect(0, 0, ancho, 32, 'F')
  doc.setTextColor(255)
  doc.setFont('helvetica', 'bold').setFontSize(20)
  doc.text('Presupuestando-ando', MARGEN, 15)
  doc.setFont('helvetica', 'normal').setFontSize(10)
  doc.text('Presupuesto de desarrollo web', MARGEN, 23)
  doc.text(fecha, ancho - MARGEN, 23, { align: 'right' })

  let y = 44
  doc.setTextColor(30)
  doc.setFont('helvetica', 'bold').setFontSize(11)
  doc.text('Cliente', MARGEN, y)
  doc.setFont('helvetica', 'normal')
  doc.text(p.cliente, MARGEN + 22, y)

  const seccion = (titulo: string) => {
    y += 10
    doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...INDIGO)
    doc.text(titulo, MARGEN, y)
    doc.setTextColor(30).setFont('helvetica', 'normal').setFontSize(10)
    y += 6
  }

  if (p.resumen) {
    seccion('Resumen del proyecto')
    const lineas = doc.splitTextToSize(p.resumen, util)
    doc.text(lineas, MARGEN, y)
    y += lineas.length * 5
  }

  seccion('Servicios y desglose')
  autoTable(doc, {
    startY: y,
    margin: { left: MARGEN, right: MARGEN },
    head: [['Servicio', 'Cant.', 'Precio', 'Importe']],
    body: p.lineas.map((l) => [
      { content: `${l.nombre}\n${l.descripcion}` },
      String(l.cantidad),
      euros(l.precioUnitario, p.moneda),
      euros(l.importe, p.moneda),
    ]),
    foot: [['Total', '', '', euros(p.total, p.moneda)]],
    headStyles: { fillColor: INDIGO },
    footStyles: { fillColor: [238, 242, 255], textColor: 20, fontStyle: 'bold', fontSize: 11 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 16 },
      2: { halign: 'right', cellWidth: 26 },
      3: { halign: 'right', cellWidth: 28 },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

  if (p.aclaraciones.length) {
    seccion('Aclaraciones y aspectos pendientes de concretar')
    for (const a of p.aclaraciones) {
      const lineas = doc.splitTextToSize(`•  ${a}`, util)
      if (y + lineas.length * 5 > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(lineas, MARGEN, y)
      y += lineas.length * 5 + 1
    }
  }

  // Pie en todas las páginas
  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFontSize(8).setTextColor(130)
    doc.text(
      'Precios sin impuestos. Presupuesto orientativo: los puntos pendientes pueden modificar el importe final.',
      MARGEN,
      290,
    )
    doc.text(`${i}/${paginas}`, ancho - MARGEN, 290, { align: 'right' })
  }
  return doc
}

export const nombreArchivo = (p: PresupuestoFinal) =>
  `presupuesto-${p.cliente.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cliente'}.pdf`
