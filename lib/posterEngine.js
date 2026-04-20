// Sulalah Poster Engine v2 - FIXED
// Fixes: generasi order, font loading, text wrapping, multi-row cards

import { getTheme, getSize } from './posterThemes'
import { calculateFamilyStats } from './posterStats'
import { calculateGenerationLevels } from './generationLevel'

export async function renderPoster({
  persons, treeName, treeDesc, sizeId, themeId, ownerName, options = {},
}) {
  const size = getSize(sizeId)
  const theme = getTheme(themeId)
  const stats = calculateFamilyStats(persons)
  const { showStats = true } = options

  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')

  await loadWebFonts()

  const W = size.width
  const H = size.height

  // Background layer
  drawBackground(ctx, W, H, theme)
  drawOrnaments(ctx, W, H, theme)

  // Layout regions
  const headerH = drawHeader(ctx, W, H, theme, { treeName, treeDesc, ownerName, size })
  const footerHeight = showStats ? fontSize(size, 120) : 0
  const footerY = H - footerHeight - pad(size, 80)
  const treeTop = headerH + pad(size, 30)
  const treeBottom = footerY - pad(size, 30)

  // Tree
  drawTree(ctx, { persons, top: treeTop, bottom: treeBottom, width: W, theme, size })

  // Footer stats
  if (showStats) {
    drawFooter(ctx, W, H, theme, { stats, size, footerY })
  }

  drawWatermark(ctx, W, H, theme, size)
  return canvas
}

function pad(size, base) {
  return size.category === 'print' ? base * 2 : base
}
function fontSize(size, base) {
  return size.category === 'print' ? base * 2 : base
}

async function loadWebFonts() {
  if (typeof document === 'undefined') return
  if (!document.getElementById('sulalah-poster-fonts')) {
    const link = document.createElement('link')
    link.id = 'sulalah-poster-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Amiri:wght@400;700&family=Merriweather:wght@400;700&family=Inter:wght@400;600;700&display=swap'
    document.head.appendChild(link)
  }
  // Wait & force-load each needed font
  const fonts = [
    '900 48px "Playfair Display"',
    '700 14px "Inter"',
    '400 14px "Merriweather"',
    '700 16px "Amiri"',
  ]
  try {
    if (document.fonts) {
      await Promise.all(fonts.map(f => document.fonts.load(f).catch(() => null)))
      await document.fonts.ready
    }
  } catch (e) {}
  await new Promise(r => setTimeout(r, 200))
}

// ────────── BACKGROUND ──────────

function drawBackground(ctx, W, H, theme) {
  ctx.fillStyle = theme.colors.bg
  ctx.fillRect(0, 0, W, H)
  if (theme.paperTexture === 'aged' || theme.paperTexture === 'wood') {
    ctx.save()
    ctx.globalAlpha = 0.07
    ctx.fillStyle = theme.colors.textMuted
    const density = Math.floor((W * H) / 3000)
    for (let i = 0; i < density; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.2 + 0.3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  // Corner vignette
  const grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.4, W/2, H/2, Math.max(W,H)*0.7)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.035)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
}

// ────────── ORNAMENTS ──────────

function drawOrnaments(ctx, W, H, theme) {
  const m = Math.min(W, H) * 0.035
  ctx.save()
  ctx.strokeStyle = theme.colors.border
  ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.0018)
  strokeRoundedRect(ctx, m, m, W - m*2, H - m*2, 18)
  ctx.lineWidth = Math.max(1, Math.min(W, H) * 0.0008)
  ctx.strokeStyle = theme.colors.ornament
  const m2 = m * 1.6
  strokeRoundedRect(ctx, m2, m2, W - m2*2, H - m2*2, 12)
  ctx.restore()
  drawCornerOrnaments(ctx, W, H, theme, m2)
}

function strokeRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.stroke()
}

function drawCornerOrnaments(ctx, W, H, theme, offset) {
  const s = Math.min(W, H) * 0.04
  ctx.save()
  ctx.fillStyle = theme.colors.ornament
  ctx.strokeStyle = theme.colors.ornament
  ctx.lineWidth = Math.max(1.5, Math.min(W, H) * 0.001)
  const corners = [
    { x: offset, y: offset, rot: 0 },
    { x: W - offset, y: offset, rot: Math.PI/2 },
    { x: W - offset, y: H - offset, rot: Math.PI },
    { x: offset, y: H - offset, rot: -Math.PI/2 },
  ]
  corners.forEach(c => {
    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.rotate(c.rot)
    drawCornerShape(ctx, s, theme.ornamentStyle)
    ctx.restore()
  })
  ctx.restore()
}

function drawCornerShape(ctx, s, style) {
  if (style === 'leaves') {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(s * 0.5, -s * 0.3, s, 0)
    ctx.quadraticCurveTo(s * 0.5, s * 0.3, 0, 0)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(-s * 0.3, s * 0.5, 0, s)
    ctx.quadraticCurveTo(s * 0.3, s * 0.5, 0, 0)
    ctx.fill()
  } else if (style === 'stars') {
    drawStar(ctx, s * 0.5, 5, s * 0.4, s * 0.2)
  } else if (style === 'vintage') {
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.5, s * 0.3, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.5, s * 0.12, 0, Math.PI * 2)
    ctx.fill()
  } else {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(s * 0.3 + i * s * 0.2, s * 0.3, Math.max(2, s * 0.04), 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawStar(ctx, cx, spikes, outerR, innerR) {
  let rot = Math.PI / 2 * 3
  const step = Math.PI / spikes
  ctx.beginPath()
  ctx.moveTo(cx, -outerR)
  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerR, y = Math.sin(rot) * outerR
    ctx.lineTo(x, y); rot += step
    x = cx + Math.cos(rot) * innerR; y = Math.sin(rot) * innerR
    ctx.lineTo(x, y); rot += step
  }
  ctx.closePath()
  ctx.fill()
}

// ────────── HEADER ──────────

function drawHeader(ctx, W, H, theme, { treeName, treeDesc, ownerName, size }) {
  const startY = pad(size, 120)
  let y = startY
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // Small label
  ctx.fillStyle = theme.colors.textMuted
  ctx.font = `700 ${fontSize(size, 13)}px "Inter", sans-serif`
  drawTextWithSpacing(ctx, 'SILSILAH KELUARGA', W / 2, y, 3)
  y += fontSize(size, 22)

  // Ornamental divider
  drawOrnamentalLine(ctx, W / 2, y + fontSize(size, 8), Math.min(W * 0.15, fontSize(size, 90)), theme)
  y += fontSize(size, 28)

  // Tree name
  ctx.fillStyle = theme.colors.text
  const titleSize = size.orientation === 'portrait' ? fontSize(size, 48) : fontSize(size, 44)
  ctx.font = `900 ${titleSize}px "Playfair Display", "Times New Roman", serif`
  const maxW = W * 0.85
  const nameLines = wrapText(ctx, treeName || 'Keluarga Besar', maxW)
  nameLines.slice(0, 2).forEach(line => {
    ctx.fillText(line, W / 2, y)
    y += titleSize * 1.1
  })

  // Description
  if (treeDesc) {
    y += fontSize(size, 4)
    ctx.fillStyle = theme.colors.textSoft
    ctx.font = `italic ${fontSize(size, 18)}px "Merriweather", serif`
    const descLines = wrapText(ctx, treeDesc, W * 0.7)
    descLines.slice(0, 1).forEach(line => {
      ctx.fillText(line, W / 2, y)
      y += fontSize(size, 24)
    })
  }

  // Meta
  y += fontSize(size, 10)
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const metaText = ownerName ? `Disusun oleh ${ownerName} · ${today}` : `Dicetak ${today}`
  ctx.fillStyle = theme.colors.textMuted
  ctx.font = `400 ${fontSize(size, 13)}px "Inter", sans-serif`
  ctx.fillText(metaText, W / 2, y)
  y += fontSize(size, 22)

  return y
}

function drawTextWithSpacing(ctx, text, x, y, spacing) {
  const chars = text.split('')
  const total = chars.reduce((w, ch, i) => w + ctx.measureText(ch).width + (i < chars.length-1 ? spacing : 0), 0)
  let cx = x - total / 2
  const oldAlign = ctx.textAlign
  ctx.textAlign = 'left'
  chars.forEach(ch => {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + spacing
  })
  ctx.textAlign = oldAlign
}

function drawOrnamentalLine(ctx, cx, cy, halfW, theme) {
  ctx.save()
  ctx.strokeStyle = theme.colors.ornament
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - halfW, cy); ctx.lineTo(cx - 12, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + halfW, cy)
  ctx.stroke()
  ctx.fillStyle = theme.colors.ornament
  ctx.beginPath()
  ctx.moveTo(cx, cy - 5); ctx.lineTo(cx + 5, cy)
  ctx.lineTo(cx, cy + 5); ctx.lineTo(cx - 5, cy)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const words = text.split(' ')
  const lines = []
  let current = ''
  words.forEach(word => {
    const test = current ? current + ' ' + word : word
    if (ctx.measureText(test).width <= maxWidth) current = test
    else {
      if (current) lines.push(current)
      current = word
    }
  })
  if (current) lines.push(current)
  return lines
}

// ────────── TREE LAYOUT (FIXED) ──────────

function drawTree(ctx, { persons, top, bottom, width, theme, size }) {
  if (!persons || persons.length === 0) return

  // Build generation tree
  const byId = {}
  persons.forEach(p => { byId[p.id] = p })
  const childrenMap = {}
  persons.forEach(p => {
    [p.father_id, p.mother_id].filter(pid => pid && byId[pid]).forEach(pid => {
      if (!childrenMap[pid]) childrenMap[pid] = []
      if (!childrenMap[pid].includes(p.id)) childrenMap[pid].push(p.id)
    })
  })

  // Use shared smart level calculator (handles partners, orphaned ancestors, etc)
  const level = calculateGenerationLevels(persons)

  // Group by generation (ASCENDING: gen 0 = oldest, at TOP)
  const gens = {}
  persons.forEach(p => {
    const l = level[p.id]
    if (!gens[l]) gens[l] = []
    gens[l].push(p)
  })
  const genNumbers = Object.keys(gens).map(Number).sort((a, b) => a - b)
  const genCount = genNumbers.length

  // ─── Calculate layout per generation (multi-row aware) ───
  const sideMargin = pad(size, 50)
  const genLabelWidth = fontSize(size, 70)
  const availWidth = width - sideMargin * 2 - genLabelWidth

  const minCardW = fontSize(size, 140)
  const maxCardW = fontSize(size, 200)
  const cardH = fontSize(size, 64)
  const rowGap = fontSize(size, 16)
  const cardGap = fontSize(size, 14)
  const genGap = fontSize(size, 30)

  // Compute rows needed per generation
  const genMeta = genNumbers.map(g => {
    const count = gens[g].length
    // How many fit per row at minCardW?
    const maxPerRow = Math.max(1, Math.floor((availWidth + cardGap) / (minCardW + cardGap)))
    const rows = Math.ceil(count / maxPerRow)
    // Actual card width (expand to fill if 1 row)
    const perRow = Math.ceil(count / rows)
    const actualCardW = Math.min(maxCardW, (availWidth - (perRow - 1) * cardGap) / perRow)
    const totalHeight = rows * cardH + (rows - 1) * rowGap
    return { gen: g, count, rows, perRow, cardW: actualCardW, totalHeight }
  })

  // Total tree height needed
  const totalTreeHeight = genMeta.reduce((sum, m) => sum + m.totalHeight, 0) + (genCount - 1) * genGap
  const availHeight = bottom - top

  // Scale down if overflow (but keep min readable)
  let scale = 1
  if (totalTreeHeight > availHeight) {
    scale = availHeight / totalTreeHeight
    scale = Math.max(0.5, scale)
  }

  // Start Y — distribute oldest (gen 0) at TOP
  let cursorY = top + (availHeight - totalTreeHeight * scale) / 2
  if (cursorY < top) cursorY = top

  // Store positions for connector lines
  const positions = {}

  // ─── Draw each generation top to bottom ───
  genMeta.forEach((meta, idx) => {
    const g = meta.gen
    const persons_g = gens[g]
    const scaledCardH = cardH * scale
    const scaledRowGap = rowGap * scale

    // Generation label on left
    const labelY = cursorY + (meta.totalHeight * scale) / 2
    ctx.save()
    ctx.fillStyle = theme.colors.textMuted
    ctx.font = `700 ${Math.max(10, fontSize(size, 13) * scale)}px "Inter", sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`GEN. ${toRoman(g + 1)}`, sideMargin, labelY)
    ctx.restore()

    // Draw cards row by row
    for (let row = 0; row < meta.rows; row++) {
      const rowY = cursorY + row * (scaledCardH + scaledRowGap)
      const startIdx = row * meta.perRow
      const endIdx = Math.min(startIdx + meta.perRow, meta.count)
      const rowCount = endIdx - startIdx

      // Center the row horizontally
      const totalRowW = rowCount * meta.cardW + (rowCount - 1) * cardGap
      const rowStartX = sideMargin + genLabelWidth + (availWidth - totalRowW) / 2

      for (let i = 0; i < rowCount; i++) {
        const p = persons_g[startIdx + i]
        const x = rowStartX + i * (meta.cardW + cardGap)
        drawPersonCard(ctx, p, x, rowY, meta.cardW, scaledCardH, theme, size, scale)
        positions[p.id] = {
          cx: x + meta.cardW / 2,
          top: rowY,
          bottom: rowY + scaledCardH,
        }
      }
    }

    cursorY += meta.totalHeight * scale + genGap
  })

  // ─── Connector lines between generations ───
  drawConnectors(ctx, persons, childrenMap, positions, theme, size)
}

function drawPersonCard(ctx, person, x, y, w, h, theme, size, scale = 1) {
  const isDeceased = !!person.death_year
  const isFemale = person.gender === 'female'

  ctx.save()
  roundRect(ctx, x, y, w, h, 8)
  ctx.fillStyle = isDeceased ? theme.colors.bgAccent : theme.colors.paper
  ctx.fill()
  ctx.strokeStyle = isDeceased ? theme.colors.textMuted : theme.colors.accent
  ctx.lineWidth = isDeceased ? 1 : 1.5
  if (isDeceased) ctx.setLineDash([4, 4])
  roundRect(ctx, x, y, w, h, 8)
  ctx.stroke()
  ctx.setLineDash([])

  // Gender stripe
  ctx.fillStyle = isFemale ? '#ec4899' : theme.colors.accent
  roundRect(ctx, x, y + 4, 3, h - 8, 1.5)
  ctx.fill()

  // Deceased marker
  if (isDeceased) {
    ctx.fillStyle = theme.colors.textMuted
    ctx.font = `${fontSize(size, 11) * scale}px serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText('☪', x + w - 8, y + 6)
  }

  // Name — wrap if needed
  ctx.fillStyle = theme.colors.text
  const nameFontSize = Math.max(9, fontSize(size, 13) * scale)
  ctx.font = `700 ${nameFontSize}px "Inter", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const nameMaxW = w - 14
  const nameLines = wrapText(ctx, person.name || '—', nameMaxW).slice(0, 2)
  const nameStart = y + Math.max(8, fontSize(size, 10) * scale)
  nameLines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, nameStart + i * nameFontSize * 1.1)
  })

  // Year info at bottom
  ctx.fillStyle = theme.colors.textMuted
  const yearFontSize = Math.max(8, fontSize(size, 11) * scale)
  ctx.font = `400 ${yearFontSize}px "Inter", sans-serif`
  let yearText = ''
  if (person.birth_year && person.death_year) yearText = `${person.birth_year} – ${person.death_year}`
  else if (person.birth_year) yearText = `lahir ${person.birth_year}`
  else if (person.death_year) yearText = `wafat ${person.death_year}`
  if (yearText) {
    ctx.fillText(yearText, x + w / 2, y + h - yearFontSize - 7)
  }

  ctx.restore()
}

function drawConnectors(ctx, persons, childrenMap, positions, theme, size) {
  ctx.save()
  ctx.strokeStyle = theme.colors.textMuted
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 0.55

  const r = Math.max(6, fontSize(size, 10))  // corner radius

  persons.forEach(p => {
    const kids = childrenMap[p.id] || []
    if (kids.length === 0) return
    const from = positions[p.id]
    if (!from) return

    kids.forEach(kidId => {
      const to = positions[kidId]
      if (!to) return
      const x1 = from.cx, y1 = from.bottom
      const x2 = to.cx, y2 = to.top
      const midY = (y1 + y2) / 2

      if (x1 === x2) {
        // Straight down
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      } else {
        // L-shape with rounded corners at (x1, midY) and (x2, midY)
        const goRight = x2 > x1
        const rr = Math.min(r, Math.abs(x2 - x1) / 2, Math.abs(midY - y1), Math.abs(y2 - midY))
        const cx1 = goRight ? x1 + rr : x1 - rr
        const cx2 = goRight ? x2 - rr : x2 + rr
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x1, midY - rr)
        ctx.quadraticCurveTo(x1, midY, cx1, midY)
        ctx.lineTo(cx2, midY)
        ctx.quadraticCurveTo(x2, midY, x2, midY + rr)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    })
  })
  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function toRoman(n) {
  const map = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]
  let r = ''
  for (const [v,s] of map) while (n >= v) { r += s; n -= v }
  return r || 'I'
}

// ────────── FOOTER ──────────

function drawFooter(ctx, W, H, theme, { stats, size, footerY }) {
  ctx.save()
  ctx.strokeStyle = theme.colors.border
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(W * 0.2, footerY)
  ctx.lineTo(W * 0.8, footerY)
  ctx.stroke()
  ctx.restore()

  const boxes = [
    { label: 'Total Anggota', value: stats.total },
    { label: 'Generasi', value: stats.generations },
    { label: 'Rentang Tahun', value: stats.yearRange || '—' },
  ]
  const boxW = W / 3
  const yBox = footerY + fontSize(size, 28)

  boxes.forEach((box, i) => {
    const cx = boxW * i + boxW / 2
    ctx.fillStyle = theme.colors.text
    ctx.font = `900 ${fontSize(size, 28)}px "Playfair Display", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(String(box.value), cx, yBox)

    ctx.fillStyle = theme.colors.textMuted
    ctx.font = `600 ${fontSize(size, 11)}px "Inter", sans-serif`
    ctx.fillText(box.label.toUpperCase(), cx, yBox + fontSize(size, 40))
  })
}

// ────────── WATERMARK ──────────

function drawWatermark(ctx, W, H, theme, size) {
  const fs = fontSize(size, 13)
  ctx.save()
  ctx.fillStyle = theme.colors.textMuted
  ctx.globalAlpha = 0.65
  ctx.font = `600 ${fs}px "Inter", sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('🌳 sulalah.my.id', W - pad(size, 45), H - pad(size, 22))
  ctx.restore()
}

// ────────── EXPORT ──────────

export function canvasToPNG(canvas, filename = 'sulalah-poster.png') {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export async function canvasToPDF(canvas, filename = 'sulalah-poster.pdf', sizeId) {
  const { jsPDF } = await import('jspdf')
  const size = getSize(sizeId)
  let pdfW, pdfH, orientation
  if (size.id === 'a4-portrait') { pdfW = 210; pdfH = 297; orientation = 'p' }
  else if (size.id === 'a4-landscape') { pdfW = 297; pdfH = 210; orientation = 'l' }
  else if (size.id === 'a3-portrait') { pdfW = 297; pdfH = 420; orientation = 'p' }
  else if (size.id === 'a3-landscape') { pdfW = 420; pdfH = 297; orientation = 'l' }
  else if (size.id === 'kuarto-portrait') { pdfW = 216; pdfH = 279; orientation = 'p' }
  else if (size.id === 'kuarto-landscape') { pdfW = 279; pdfH = 216; orientation = 'l' }
  else if (size.id === 'ig-story') { pdfW = 108; pdfH = 192; orientation = 'p' }
  else if (size.id === 'ig-post') { pdfW = 108; pdfH = 108; orientation = 'p' }
  else { pdfW = 210; pdfH = 297; orientation = 'p' }
  const pdf = new jsPDF({ orientation, unit: 'mm', format: orientation === 'p' ? [pdfW, pdfH] : [pdfH, pdfW] })
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH)
  pdf.save(filename)
}
