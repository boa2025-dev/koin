/**
 * Genera los íconos PWA como PNG usando solo Node.js built-ins (zlib).
 * Produce un ícono con fondo oscuro (#080B14) y un cuadrado redondeado violeta (#7C6EFF).
 */
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dir, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// CRC32
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[i] = c
}
const crc32 = (data) => {
  let crc = 0xffffffff
  for (const b of data) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function createIcon(size) {
  // Colores
  const BG  = [8, 11, 20]       // #080B14
  const VIO = [124, 110, 255]   // #7C6EFF
  const GRN = [47, 255, 160]    // #2FFFA0 — acento para el punto de la "i"

  // Parámetros del rectángulo redondeado interior
  const pad    = Math.round(size * 0.15)
  const radius = Math.round(size * 0.22)

  // Dibuja pixel a pixel (RGBA → RGB)
  const raw = Buffer.alloc(size * (1 + size * 3))

  const inRoundedRect = (x, y) => {
    const x0 = pad, y0 = pad, x1 = size - pad - 1, y1 = size - pad - 1
    if (x < x0 || x > x1 || y < y0 || y > y1) return false
    // esquinas redondeadas
    const corners = [[x0+radius,y0+radius],[x1-radius,y0+radius],[x0+radius,y1-radius],[x1-radius,y1-radius]]
    for (const [cx, cy] of corners) {
      if (x < cx - radius || x > cx + radius) continue
      if (y < cy - radius || y > cy + radius) continue
      // en zona de esquina: verificar radio
      if ((x-cx)**2 + (y-cy)**2 > radius**2) return false
    }
    return true
  }

  // Punto de la "i" — pequeño círculo verde en la parte superior del rect
  const dotR  = Math.round(size * 0.07)
  const dotCX = Math.round(size / 2)
  const dotCY = Math.round(size * 0.33)
  const inDot = (x, y) => (x-dotCX)**2 + (y-dotCY)**2 <= dotR**2

  // Barra de la "i" — rectángulo centrado debajo del punto
  const barW  = Math.round(size * 0.1)
  const barH  = Math.round(size * 0.22)
  const barX0 = Math.round(size/2 - barW/2)
  const barX1 = barX0 + barW
  const barY0 = Math.round(size * 0.44)
  const barY1 = barY0 + barH
  const inBar = (x, y) => x >= barX0 && x <= barX1 && y >= barY0 && y <= barY1

  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 3)
    raw[rowStart] = 0 // filter None
    for (let x = 0; x < size; x++) {
      const off = rowStart + 1 + x * 3
      let px
      if (inRoundedRect(x, y)) {
        if (inDot(x, y))       px = GRN
        else if (inBar(x, y))  px = [255, 255, 255]
        else                   px = VIO
      } else {
        px = BG
      }
      raw[off]   = px[0]
      raw[off+1] = px[1]
      raw[off+2] = px[2]
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync(join(publicDir, 'pwa-192x192.png'), createIcon(192))
writeFileSync(join(publicDir, 'pwa-512x512.png'), createIcon(512))
writeFileSync(join(publicDir, 'apple-touch-icon.png'), createIcon(180))
console.log('✓ Íconos PWA generados en public/')
