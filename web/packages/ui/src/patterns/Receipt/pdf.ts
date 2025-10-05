export interface ReceiptPdfField {
  label: string
  value: string
}

export interface ReceiptPdfOptions {
  title: string
  referenceNumber: string
  issuedAt: string
  issuedBy?: string
  subtitle?: string
  organization?: {
    name?: string
    address?: string
    contact?: string
  }
  fields: ReceiptPdfField[]
  meta?: ReceiptPdfField[]
  notes?: string
}

interface PdfLine {
  text: string
  fontSize: number
}

const PAGE_WIDTH = 595.28 // A4 width in points (72 DPI)
const PAGE_HEIGHT = 841.89 // A4 height in points
const MARGIN = 56
const TITLE_FONT_SIZE = 18
const BODY_FONT_SIZE = 12
const SMALL_FONT_SIZE = 10
const LINE_SPACING = 6
const WRAP_WIDTH = 86

export async function generateReceiptPdf(options: ReceiptPdfOptions): Promise<Blob> {
  const lines: PdfLine[] = []

  const addLine = (text: string, fontSize = BODY_FONT_SIZE) => {
    wrapText(text, WRAP_WIDTH).forEach((segment, index) => {
      const indent = index > 0 ? '  ' : ''
      lines.push({ text: `${indent}${segment}`, fontSize })
    })
  }

  const addBlank = () => {
    lines.push({ text: ' ', fontSize: BODY_FONT_SIZE })
  }

  if (options.organization?.name) {
    addLine(options.organization.name, BODY_FONT_SIZE + 2)
  }
  if (options.organization?.address) {
    addLine(options.organization.address, SMALL_FONT_SIZE)
  }
  if (options.organization?.contact) {
    addLine(options.organization.contact, SMALL_FONT_SIZE)
  }

  if (options.organization?.name) {
    addBlank()
  }

  addLine(options.title, TITLE_FONT_SIZE)
  if (options.subtitle) {
    addLine(options.subtitle, BODY_FONT_SIZE)
  }

  addBlank()
  addLine(`Reference: ${options.referenceNumber}`, BODY_FONT_SIZE)

  const issuedDate = formatDate(options.issuedAt)
  addLine(`Issued on: ${issuedDate}`, SMALL_FONT_SIZE)
  if (options.issuedBy) {
    addLine(`Issued by: ${options.issuedBy}`, SMALL_FONT_SIZE)
  }

  if (options.meta?.length) {
    addBlank()
    options.meta.forEach((meta) => addLine(`${meta.label}: ${meta.value}`, BODY_FONT_SIZE))
  }

  if (options.fields.length) {
    addBlank()
    addLine('Details', BODY_FONT_SIZE + 1)
    options.fields.forEach((field) => {
      addLine(`${field.label}: ${field.value}`, BODY_FONT_SIZE)
    })
  }

  if (options.notes) {
    addBlank()
    addLine('Notes', BODY_FONT_SIZE + 1)
    addLine(options.notes, BODY_FONT_SIZE)
  }

  addBlank()
  addLine('This is a system generated receipt. No signature required.', SMALL_FONT_SIZE)

  const pageStreams = paginateLines(lines)
  const pdfString = buildPdf(pageStreams)
  const encoder = new TextEncoder()
  const bytes = encoder.encode(pdfString)
  return new Blob([bytes], { type: 'application/pdf' })
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return ['']
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  words.forEach((word) => {
    const tentative = current ? `${current} ${word}` : word
    if (tentative.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = tentative
    }
  })

  if (current) {
    lines.push(current)
  }

  return lines.length ? lines : ['']
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso
    return new Intl.DateTimeFormat('ne-NP', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date)
  } catch (error) {
    console.warn('Failed to format date for receipt PDF:', error)
    return iso
  }
}

function paginateLines(lines: PdfLine[]): string[] {
  const usableHeight = PAGE_HEIGHT - MARGIN * 2
  let remainingHeight = usableHeight
  const pages: string[] = []
  let currentLines: PdfLine[] = []

  lines.forEach((line) => {
    const lineHeight = line.fontSize + LINE_SPACING
    if (lineHeight > remainingHeight && currentLines.length) {
      pages.push(renderLines(currentLines))
      currentLines = []
      remainingHeight = usableHeight
    }

    currentLines.push(line)
    remainingHeight -= lineHeight
  })

  if (currentLines.length) {
    pages.push(renderLines(currentLines))
  }

  return pages
}

function renderLines(lines: PdfLine[]): string {
  const parts: string[] = []
  let cursorY = PAGE_HEIGHT - MARGIN

  lines.forEach((line) => {
    const escaped = escapePdfText(line.text)
    parts.push(
      `BT\n/F1 ${line.fontSize} Tf\n1 0 0 1 ${MARGIN} ${cursorY.toFixed(2)} Tm\n(${escaped}) Tj\nET\n`
    )
    cursorY -= line.fontSize + LINE_SPACING
  })

  return parts.join('')
}

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function buildPdf(pageStreams: string[]): string {
  const objects: string[] = []
  const addObject = (content = '') => {
    objects.push(content)
    return objects.length
  }

  const catalogObj = addObject()
  const pagesObj = addObject()
  const fontObj = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  const contentObjs: number[] = []
  const pageObjs: number[] = []

  pageStreams.forEach((stream) => {
    const contentObj = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    contentObjs.push(contentObj)
    const pageObj = addObject()
    pageObjs.push(pageObj)
  })

  pageObjs.forEach((pageObj, index) => {
    const contentRef = contentObjs[index]
    objects[pageObj - 1] =
      `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] ` +
      `/Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentRef} 0 R >>`
  })

  objects[pagesObj - 1] =
    `<< /Type /Pages /Kids [${pageObjs.map((num) => `${num} 0 R`).join(' ')}] /Count ${pageObjs.length} >>`
  objects[catalogObj - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`

  const header = '%PDF-1.4\n'
  let body = ''
  const offsets: number[] = []

  objects.forEach((content, index) => {
    offsets.push(header.length + body.length)
    body += `${index + 1} 0 obj\n${content}\nendobj\n`
  })

  const xrefOffset = header.length + body.length
  const xrefEntries = ['0000000000 65535 f ']
  offsets.forEach((offset) => {
    xrefEntries.push(`${offset.toString().padStart(10, '0')} 00000 n `)
  })

  const xref = `xref\n0 ${objects.length + 1}\n${xrefEntries.join('\n')}\n`
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return header + body + xref + trailer
}
