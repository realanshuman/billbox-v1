'use client'

import { jsPDF } from 'jspdf'
import type { Currency, Invoice, InvoiceItem } from './types'
import { formatCurrency } from './utils'

interface Company {
  name: string
  email: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  tax_id?: string
}

interface Customer {
  name: string
  email: string
  address?: string
  city?: string
  state?: string
  country?: string
  tax_id?: string
}

interface GeneratePDFOptions {
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
  company: Company
  template?: 'classic'
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function generateInvoicePDF({ invoice, company }: GeneratePDFOptions): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const currency = invoice.currency as Currency
  const W = 210
  const margin = 14
  const contentW = W - margin * 2

  // Helvetica throughout
  doc.setFont('helvetica', 'normal')

  // ─── Header bar ───────────────────────────────────────────────
  doc.setFillColor(15, 15, 15)
  doc.rect(0, 0, W, 18, 'F')

  // Logo square
  doc.setFillColor(255, 255, 255)
  doc.rect(margin, 5, 6, 6, 'F')

  // "billbox" wordmark
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('billbox', margin + 9, 10)

  // Invoice type label top-right
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  const typeLabel = invoice.type === 'proforma' ? 'PROFORMA INVOICE' : 'TAX INVOICE'
  doc.text(typeLabel, W - margin, 10, { align: 'right' })

  // ─── Invoice number + status ───────────────────────────────────
  let y = 30
  doc.setTextColor(15, 15, 15)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.number, margin, y)

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    paid:      [22, 163, 74],
    pending:   [217, 119, 6],
    overdue:   [220, 38, 38],
    cancelled: [107, 114, 128],
    draft:     [107, 114, 128],
  }
  const [r, g, b] = statusColors[invoice.status] ?? [100, 100, 100]
  const statusText = `+ ${invoice.status.toUpperCase()}`
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  const statusW = doc.getTextWidth(statusText) + 5
  const badgeX = W - margin - statusW
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(0.4)
  doc.roundedRect(badgeX, y - 5, statusW, 6, 1, 1, 'S')
  doc.setTextColor(r, g, b)
  doc.text(statusText, badgeX + 2.5, y - 0.5)

  // ─── Divider ──────────────────────────────────────────────────
  y += 6
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.3)
  doc.line(margin, y, W - margin, y)

  // ─── From / Bill To ───────────────────────────────────────────
  y += 8
  const colMid = margin + contentW / 2

  // FROM label
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text('FROM', margin, y)
  doc.text('BILL TO', colMid, y)

  y += 5
  doc.setTextColor(15, 15, 15)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name, margin, y)
  doc.text(invoice.customer.name, colMid, y)

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)

  const fromLines = [
    company.email,
    company.address,
    [company.city, company.state].filter(Boolean).join(', '),
    company.country,
    company.tax_id ? `GST: ${company.tax_id}` : null,
  ].filter(Boolean) as string[]

  const toLines = [
    invoice.customer.email,
    invoice.customer.address,
    [invoice.customer.city, invoice.customer.state].filter(Boolean).join(', '),
    invoice.customer.country,
    invoice.customer.tax_id ? `GST: ${invoice.customer.tax_id}` : null,
  ].filter(Boolean) as string[]

  const maxLines = Math.max(fromLines.length, toLines.length)
  for (let i = 0; i < maxLines; i++) {
    if (fromLines[i]) doc.text(fromLines[i], margin, y)
    if (toLines[i]) doc.text(toLines[i], colMid, y)
    y += 4.5
  }

  // ─── Dates / Currency ─────────────────────────────────────────
  y += 4
  doc.setDrawColor(230, 230, 230)
  doc.line(margin, y, W - margin, y)
  y += 6

  const thirdW = contentW / 3
  const dateFields = [
    { label: 'ISSUE DATE', value: formatDate(invoice.issue_date) },
    { label: 'DUE DATE', value: formatDate(invoice.due_date) },
    { label: 'CURRENCY', value: currency },
  ]
  dateFields.forEach(({ label, value }, i) => {
    const x = margin + i * thirdW
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(label, x, y)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 15, 15)
    doc.text(value, x, y + 5)
  })

  // ─── Line items table ─────────────────────────────────────────
  y += 16
  doc.setFillColor(248, 248, 248)
  doc.rect(margin, y - 3, contentW, 7, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)

  const cols = {
    item:  margin,
    qty:   margin + contentW * 0.48,
    price: margin + contentW * 0.6,
    tax:   margin + contentW * 0.75,
    total: W - margin,
  }
  doc.text('ITEM', cols.item, y)
  doc.text('QTY', cols.qty, y)
  doc.text('UNIT PRICE', cols.price, y)
  doc.text('TAX', cols.tax, y)
  doc.text('TOTAL', cols.total, y, { align: 'right' })

  y += 3
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, W - margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 15, 15)
  doc.setFontSize(8.5)

  for (const item of (invoice.items ?? [])) {
    y += 7
    // Wrap long item names
    const nameLines = doc.splitTextToSize(item.name, contentW * 0.44)
    doc.text(nameLines, cols.item, y)
    doc.text(String(item.quantity), cols.qty, y)
    doc.text(formatCurrency(item.unit_price, currency), cols.price, y)
    doc.setTextColor(80, 80, 80)
    doc.text(`${item.tax_rate}%`, cols.tax, y)
    doc.setTextColor(15, 15, 15)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(item.total, currency), cols.total, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    if (nameLines.length > 1) y += (nameLines.length - 1) * 4.5

    doc.setDrawColor(240, 240, 240)
    doc.line(margin, y + 2, W - margin, y + 2)
  }

  // ─── Totals ───────────────────────────────────────────────────
  y += 10
  const totalsX = W - margin - 70
  doc.setFontSize(8.5)

  const rows: [string, string][] = [
    ['Subtotal', formatCurrency(invoice.subtotal, currency)],
    ['Tax', formatCurrency(invoice.tax_total, currency)],
  ]
  for (const [label, val] of rows) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(label, totalsX, y)
    doc.setTextColor(15, 15, 15)
    doc.text(val, W - margin, y, { align: 'right' })
    y += 6
  }

  // Total line
  doc.setDrawColor(200, 200, 200)
  doc.line(totalsX, y - 1, W - margin, y - 1)
  y += 5
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 15, 15)
  doc.text('Total', totalsX, y)
  doc.text(formatCurrency(invoice.total, currency), W - margin, y, { align: 'right' })

  // ─── Notes ────────────────────────────────────────────────────
  if (invoice.notes) {
    y += 12
    doc.setDrawColor(230, 230, 230)
    doc.line(margin, y, W - margin, y)
    y += 7
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('NOTES', margin, y)
    y += 4
    doc.setFontSize(8.5)
    doc.setTextColor(60, 60, 60)
    const noteLines = doc.splitTextToSize(invoice.notes, contentW)
    doc.text(noteLines, margin, y)
  }

  // ─── Footer ───────────────────────────────────────────────────
  const pageH = 297
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text('Generated by billbox', margin, pageH - 8)
  doc.text(new Date().toLocaleDateString('en-GB'), W - margin, pageH - 8, { align: 'right' })

  doc.save(`${invoice.number}.pdf`)
}
