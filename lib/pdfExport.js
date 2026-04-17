// ═══════════════════════════════════════════════════════
// Sulalah — Poster Export Engine v2
// Render langsung dari data ke canvas — tajam di semua ukuran
// TIDAK pakai html2canvas (screenshot) — gambar ulang dari nol
// ═══════════════════════════════════════════════════════

import { computeGenerations } from './mahram'

// ── Dimensi node di canvas (pixel asli sebelum di-scale) ──
const NW=172, NH=70, HG=28, VG=90, PAD=50

// ── 10 Tema Poster ──────────────────────────────────────
export const POSTER_THEMES = [
  // FREE (5)
  {
    id:'clean',    name:'Bersih',           premium:false,
    desc:'Putih minimalis, profesional',
    previewBg:'#ffffff', previewAccent:'#0d9488', previewBorder:'#d1faf4',
    bg:['#ffffff','#f0fdfa'], border:'#d1faf4', accent:'#0d9488',
    text:'#0f2520', subtext:'#4b6b66', treeBg:'rgba(240,253,250,0.85)', ornament:'clean-frame',
  },
  {
    id:'kayu',     name:'Kayu Jati',        premium:false,
    desc:'Hangat seperti ukiran kayu antik',
    previewBg:'#fdf6ee', previewAccent:'#a16207', previewBorder:'#d4a96a',
    bg:['#fdf6ee','#f0dfc0'], border:'#d4a96a', accent:'#a16207',
    text:'#3d2000', subtext:'#7a5c2e', treeBg:'rgba(255,249,240,0.88)', ornament:'corner-vines',
  },
  {
    id:'islami',   name:'Islami Hijau',     premium:false,
    desc:'Hijau daun, nuansa pesantren & masjid',
    previewBg:'#f0f7f0', previewAccent:'#1b5e20', previewBorder:'#81c784',
    bg:['#f0f7f0','#e0f0e0'], border:'#81c784', accent:'#1b5e20',
    text:'#1a3a1a', subtext:'#4a7a4a', treeBg:'rgba(240,247,240,0.88)', ornament:'islamic-stars',
  },
  {
    id:'elegan',   name:'Elegan Gelap',     premium:false,
    desc:'Navy & emas, abadi dan berkelas',
    previewBg:'#1a1a2e', previewAccent:'#e2c97e', previewBorder:'#4a4a6a',
    bg:['#1a1a2e','#0f0f1e'], border:'#4a4a6a', accent:'#e2c97e',
    text:'#f0e6d3', subtext:'#b8a98a', treeBg:'rgba(22,33,62,0.85)', ornament:'gold-lines',
  },
  {
    id:'pesisir',  name:'Pesisir Biru',     premium:false,
    desc:'Gradasi laut biru jernih',
    previewBg:'#dbeafe', previewAccent:'#0284c7', previewBorder:'#93c5fd',
    bg:['#dbeafe','#e0f2fe'], border:'#93c5fd', accent:'#0284c7',
    text:'#0c2340', subtext:'#1e4a6a', treeBg:'rgba(224,242,254,0.85)', ornament:'wave-lines',
  },
  // PREMIUM (5)
  {
    id:'batik',    name:'Batik Nusantara',  premium:true,
    desc:'Ornamen batik, khas Nusantara',
    previewBg:'#fff8f0', previewAccent:'#922b21', previewBorder:'#c0392b',
    bg:['#fff8f0','#fdebd0'], border:'#c0392b', accent:'#922b21',
    text:'#1a0800', subtext:'#6e2c00', treeBg:'rgba(255,252,245,0.9)', ornament:'batik',
  },
  {
    id:'emas',     name:'Emas Kerajaan',    premium:true,
    desc:'Hitam & emas mewah berkilau',
    previewBg:'#1c1008', previewAccent:'#ffd700', previewBorder:'#d4af37',
    bg:['#1c1008','#2d1b00'], border:'#d4af37', accent:'#ffd700',
    text:'#fef9e7', subtext:'#d4af37', treeBg:'rgba(30,20,5,0.88)', ornament:'royal-gold',
  },
  {
    id:'taman',    name:'Taman Bunga',      premium:true,
    desc:'Pastel lembut & cantik',
    previewBg:'#fdf0f8', previewAccent:'#ad1457', previewBorder:'#f48fb1',
    bg:['#fdf0f8','#f3e5f5'], border:'#f48fb1', accent:'#ad1457',
    text:'#2d0d1f', subtext:'#7b3f6e', treeBg:'rgba(253,240,248,0.88)', ornament:'floral',
  },
  {
    id:'langit',   name:'Langit Malam',     premium:true,
    desc:'Ungu tua & bintang-bintang',
    previewBg:'#0d0221', previewAccent:'#a78bfa', previewBorder:'#7c3aed',
    bg:['#0d0221','#120a2e'], border:'#7c3aed', accent:'#a78bfa',
    text:'#ede9fe', subtext:'#a78bfa', treeBg:'rgba(18,10,46,0.88)', ornament:'starfield',
  },
  {
    id:'kaligrafi',name:'Kaligrafi Emas',   premium:true,
    desc:'Krem & emas, nuansa mushaf Islam',
    previewBg:'#fffff0', previewAccent:'#8b6914', previewBorder:'#b8860b',
    bg:['#fffff0','#fdf5d0'], border:'#b8860b', accent:'#8b6914',
    text:'#2c1810', subtext:'#6b4226', treeBg:'rgba(255,255,240,0.88)', ornament:'kaligrafi',
  },
]

// ── Layout engine (sama persis dengan FamilyTree.js) ───

function computePosterLayout(persons) {
  if (!persons.length) return { positions:{}, gens:[], treeW:800, treeH:400 }
  const map={}; persons.forEach(p=>map[p.id]=p)
  const cache = computeGenerations(persons)
  const byGen={}
  persons.forEach(p=>{ const g=cache[p.id]||0; (byGen[g]=byGen[g]||[]).push(p.id) })
  const gens=Object.keys(byGen).map(Number).sort((a,b)=>a-b)
  let maxN=0; Object.values(byGen).forEach(ids=>{ if(ids.length>maxN)maxN=ids.length })
  const svgW=Math.max(maxN*(NW+HG)-HG+PAD*2, NW+PAD*2)
  const positions={}
  const coupleMap={}
  persons.forEach(p=>{
    if(!p.father_id||!p.mother_id) return
    coupleMap[p.father_id]=p.mother_id; coupleMap[p.mother_id]=p.father_id
  })
  gens.forEach(g=>{
    const ids=[...byGen[g]]
    const pcx=id=>{ const p=map[id]; if(!p) return -1; const xs=[p.father_id,p.mother_id].filter(Boolean).map(x=>positions[x]?.cx??-1).filter(x=>x>=0); return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:-1 }
    const visited=new Set(), ordered=[]
    const sorted=[...ids].sort((a,b)=>{ const ax=pcx(a),bx=pcx(b); if(ax<0&&bx<0) return (map[a]?.birth_order||0)-(map[b]?.birth_order||0); if(ax<0)return 1; if(bx<0)return -1; if(Math.abs(ax-bx)>1)return ax-bx; return (map[a]?.birth_order||0)-(map[b]?.birth_order||0) })
    sorted.forEach(id=>{ if(visited.has(id))return; visited.add(id);ordered.push(id); const partner=coupleMap[id]; if(partner&&!visited.has(partner)&&ids.includes(partner)){visited.add(partner);ordered.push(partner)} })
    const rowW=ordered.length*(NW+HG)-HG
    const sx=PAD+(svgW-PAD*2-rowW)/2
    const y=PAD+g*(NH+VG)
    ordered.forEach((id,i)=>{ const x=sx+i*(NW+HG); positions[id]={x,y,cx:x+NW/2} })
  })
  return { positions, gens, treeW:svgW, treeH:Math.max(...gens)*(NH+VG)+NH+PAD*2 }
}

// ── Canvas rendering helpers ───────────────────────────

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r)
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r)
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r)
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r)
  ctx.closePath()
}

function truncate(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  while (text.length > 2 && ctx.measureText(text+'…').width > maxW) text=text.slice(0,-1)
  return text+'…'
}

function ini(n) { return n.trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?' }

function drawNode(ctx, p) {
  const { x, y } = p._pos
  const isMale=p.gender==='male', isDead=!!p.death_year
  // Card
  rr(ctx,x,y,NW,NH,8)
  ctx.fillStyle=isDead?'#f5f5f5':isMale?'#f0fdfa':'#fff1f2'
  ctx.globalAlpha=isDead?0.55:1; ctx.fill(); ctx.globalAlpha=1
  ctx.strokeStyle='#e0e0e0'; ctx.lineWidth=0.5; ctx.stroke()
  // Left border
  ctx.fillStyle=isMale?'#14b8a6':'#e11d48'
  ctx.fillRect(x,y+6,4,NH-12)
  // Avatar
  const aR=NH*0.28, ax=x+12+aR, ay=y+NH/2
  ctx.beginPath(); ctx.arc(ax,ay,aR,0,Math.PI*2)
  ctx.fillStyle=isMale?'#ccfbf1':'#ffe4e6'; ctx.fill()
  ctx.fillStyle=isMale?'#0f766e':'#be123c'
  ctx.font=`700 ${aR*0.85}px -apple-system,sans-serif`
  ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillText(ini(p.name), ax, ay)
  // Name
  const tx=x+12+aR*2+8, tw=NW-tx+x-6
  ctx.fillStyle='#0f2520'; ctx.font=`600 ${NH*0.22}px -apple-system,sans-serif`
  ctx.textAlign='left'; ctx.textBaseline='alphabetic'
  ctx.fillText(truncate(ctx,p.name,tw), tx, y+NH*0.44)
  // Year
  const yr=p.birth_year?(p.death_year?`${p.birth_year}–${p.death_year}`:`b.${p.birth_year}`):'';
  if(yr){ ctx.fillStyle='#4b6b66'; ctx.font=`${NH*0.17}px -apple-system,sans-serif`; ctx.fillText(yr,tx,y+NH*0.68) }
  // Self
  if(p.is_self){ ctx.fillStyle='#14b8a6'; ctx.font=`700 ${NH*0.15}px -apple-system,sans-serif`; ctx.fillText('● Anda',tx,y+NH*0.87) }
}

// ── Ornament functions ─────────────────────────────────

function draw8Star(ctx,cx,cy,r1,r2){ ctx.beginPath(); for(let i=0;i<16;i++){const a=(i*Math.PI/8)-Math.PI/2,r=i%2===0?r1:r2; i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))} ctx.closePath() }

function oCleanFrame(ctx,W,H,t){const m=48; ctx.strokeStyle=t.border;ctx.lineWidth=4;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.lineWidth=1.5;ctx.strokeRect(m+16,m+16,W-(m+16)*2,H-(m+16)*2);ctx.fillStyle=t.accent;[[m,m],[W-m,m],[m,H-m],[W-m,H-m]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill()});[[W/2,m],[W/2,H-m],[m,H/2],[W-m,H/2]].forEach(([x,y])=>{ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-7,-7,14,14);ctx.restore()})}
function oCornerVines(ctx,W,H,t){const m=45,arm=140; ctx.strokeStyle=t.border;ctx.lineWidth=2.5;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.strokeStyle=t.accent;ctx.lineWidth=1;ctx.strokeRect(m+14,m+14,W-(m+14)*2,H-(m+14)*2);ctx.lineWidth=4;ctx.strokeStyle=t.accent;[[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]].forEach(([cx,cy,dx,dy])=>{ctx.beginPath();ctx.moveTo(cx+dx*arm,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+dy*arm);ctx.stroke();for(let i=20;i<arm-20;i+=28){ctx.beginPath();ctx.arc(cx+dx*i,cy,3,0,Math.PI*2);ctx.fillStyle=t.accent;ctx.globalAlpha=0.4;ctx.fill();ctx.globalAlpha=1}ctx.beginPath();ctx.arc(cx,cy,10,0,Math.PI*2);ctx.fillStyle=t.accent;ctx.fill()})}
function oIslamicStars(ctx,W,H,t){const m=44;ctx.strokeStyle=t.border;ctx.lineWidth=2;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.strokeRect(m+14,m+14,W-(m+14)*2,H-(m+14)*2);const sp=68;ctx.fillStyle=t.accent;ctx.strokeStyle=t.border;ctx.lineWidth=0.8;const star=(x,y,big)=>{draw8Star(ctx,x,y,big?32:22,big?13:9);ctx.globalAlpha=big?0.9:0.65;ctx.fill();ctx.globalAlpha=1;ctx.stroke()};for(let x=m+sp;x<W-m-sp/2;x+=sp){star(x,m,false);star(x,H-m,false)}for(let y=m+sp;y<H-m-sp/2;y+=sp){star(m,y,false);star(W-m,y,false)}[[m,m],[W-m,m],[m,H-m],[W-m,H-m]].forEach(([x,y])=>star(x,y,true))}
function oGoldLines(ctx,W,H,t){const m=44;ctx.shadowColor=t.accent;ctx.shadowBlur=16;ctx.strokeStyle=t.accent;ctx.lineWidth=3;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.shadowBlur=0;ctx.strokeStyle=t.border;ctx.lineWidth=1;ctx.strokeRect(m+14,m+14,W-(m+14)*2,H-(m+14)*2);ctx.strokeRect(m+22,m+22,W-(m+22)*2,H-(m+22)*2);const arm=120;ctx.strokeStyle=t.accent;ctx.lineWidth=3;[[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]].forEach(([cx,cy,dx,dy])=>{ctx.beginPath();ctx.moveTo(cx+dx*arm,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+dy*arm);ctx.stroke();draw8Star(ctx,cx,cy,18,7);ctx.fillStyle=t.accent;ctx.globalAlpha=0.85;ctx.fill();ctx.globalAlpha=1})}
function oWaveLines(ctx,W,H,t){const m=44;ctx.strokeStyle=t.border;ctx.lineWidth=2.5;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.strokeStyle=t.accent;ctx.lineWidth=1.5;const wave=(yB,flip)=>{ctx.beginPath();for(let i=0;i<=80;i++){const x=m+(i/80)*(W-m*2);const y=yB+Math.sin((i/80)*Math.PI*12)*10*(flip?-1:1);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()};ctx.globalAlpha=0.5;wave(m+16,false);wave(H-m-16,true);ctx.globalAlpha=1;for(let y=m+50;y<H-m;y+=50){ctx.beginPath();ctx.arc(m+8,y,2,0,Math.PI*2);ctx.fillStyle=t.accent;ctx.fill();ctx.beginPath();ctx.arc(W-m-8,y,2,0,Math.PI*2);ctx.fill()}}
function oBatik(ctx,W,H,t){const m=40;ctx.strokeStyle=t.border;ctx.lineWidth=10;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.strokeStyle=t.accent;ctx.lineWidth=2;ctx.strokeRect(m+20,m+20,W-(m+20)*2,H-(m+20)*2);ctx.strokeStyle=t.border;ctx.lineWidth=1;ctx.strokeRect(m+30,m+30,W-(m+30)*2,H-(m+30)*2);ctx.fillStyle=t.accent;ctx.globalAlpha=0.55;const d=(x,y,s)=>{ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-s/2,-s/2,s,s);ctx.restore()};const sp=52;for(let x=m+sp;x<W-m;x+=sp){d(x,m+10,14);d(x,H-m-10,14)}for(let y=m+sp;y<H-m;y+=sp){d(m+10,y,14);d(W-m-10,y,14)}ctx.globalAlpha=1;[[m,m],[W-m,m],[m,H-m],[W-m,H-m]].forEach(([x,y])=>{d(x,y,22)})}
function oRoyalGold(ctx,W,H,t){[44,56,66].forEach((m,i)=>{ctx.shadowColor=t.accent;ctx.shadowBlur=i===0?22:0;ctx.strokeStyle=i%2===0?t.accent:t.border;ctx.lineWidth=i===0?4:1;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.shadowBlur=0});[[66,66],[W-66,66],[66,H-66],[W-66,H-66],[W/2,66],[W/2,H-66],[66,H/2],[W-66,H/2]].forEach(([x,y],i)=>{const big=i<4;draw8Star(ctx,x,y,big?32:18,big?13:7);ctx.fillStyle=t.accent;ctx.globalAlpha=big?0.9:0.6;ctx.fill();ctx.globalAlpha=1})}
function oFloral(ctx,W,H,t){const m=44;ctx.strokeStyle=t.border;ctx.lineWidth=2;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.strokeRect(m+12,m+12,W-(m+12)*2,H-(m+12)*2);const flower=(x,y,r)=>{for(let i=0;i<6;i++){const a=(i*Math.PI)/3;ctx.beginPath();ctx.arc(x+r*0.65*Math.cos(a),y+r*0.65*Math.sin(a),r*0.45,0,Math.PI*2);ctx.fillStyle=t.accent;ctx.globalAlpha=0.4;ctx.fill();ctx.globalAlpha=1}ctx.beginPath();ctx.arc(x,y,r*0.35,0,Math.PI*2);ctx.fillStyle=t.accent;ctx.fill()};[[m,m],[W-m,m],[m,H-m],[W-m,H-m],[W/2,m],[W/2,H-m],[m,H/2],[W-m,H/2]].forEach(([x,y])=>flower(x,y,30))}
function oStarfield(ctx,W,H,t){const rng=s=>{let x=Math.sin(s)*10000;return x-Math.floor(x)};ctx.fillStyle=t.accent;for(let i=0;i<300;i++){const x=rng(i*2.1)*W,y=rng(i*3.7)*H,sz=rng(i*5.3)*2.5+0.5;ctx.globalAlpha=rng(i*7.1)*0.5+0.1;ctx.beginPath();ctx.arc(x,y,sz,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;const m=44;ctx.shadowColor=t.accent;ctx.shadowBlur=14;ctx.strokeStyle=t.accent;ctx.lineWidth=2;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.shadowBlur=0;ctx.strokeStyle=t.border;ctx.lineWidth=1;ctx.strokeRect(m+16,m+16,W-(m+16)*2,H-(m+16)*2);[[m,m],[W-m,m],[m,H-m],[W-m,H-m]].forEach(([x,y])=>{draw8Star(ctx,x,y,22,9);ctx.fillStyle=t.accent;ctx.globalAlpha=0.8;ctx.fill();ctx.globalAlpha=1})}
function oKaligrafi(ctx,W,H,t){const m=44;ctx.strokeStyle=t.border;ctx.lineWidth=5;ctx.strokeRect(m,m,W-m*2,H-m*2);ctx.lineWidth=1;ctx.strokeRect(m+16,m+16,W-(m+16)*2,H-(m+16)*2);const d=(x,y)=>{ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-9,-9,18,18);ctx.restore()};ctx.fillStyle=t.accent;ctx.globalAlpha=0.45;const sp=44;for(let x=m+sp;x<W-m;x+=sp){d(x,m+8);d(x,H-m-8)}for(let y=m+sp;y<H-m;y+=sp){d(m+8,y);d(W-m-8,y)}ctx.globalAlpha=1;[[m,m],[W-m,m],[m,H-m],[W-m,H-m]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.fillStyle=t.accent;ctx.fill();ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.strokeStyle=t.bg[0];ctx.lineWidth=2;ctx.stroke()})}

function drawOrnament(ctx,W,H,t){switch(t.ornament){case'clean-frame':oCleanFrame(ctx,W,H,t);break;case'corner-vines':oCornerVines(ctx,W,H,t);break;case'islamic-stars':oIslamicStars(ctx,W,H,t);break;case'gold-lines':oGoldLines(ctx,W,H,t);break;case'wave-lines':oWaveLines(ctx,W,H,t);break;case'batik':oBatik(ctx,W,H,t);break;case'royal-gold':oRoyalGold(ctx,W,H,t);break;case'floral':oFloral(ctx,W,H,t);break;case'starfield':oStarfield(ctx,W,H,t);break;case'kaligrafi':oKaligrafi(ctx,W,H,t);break}}

// ── Render tree langsung ke poster canvas ──────────────

function renderTree(ctx, persons, areaX, areaY, areaW, areaH) {
  const { positions, gens, treeW, treeH } = computePosterLayout(persons)
  const map={}; persons.forEach(p=>map[p.id]=p)
  const scale = Math.min(areaW/treeW, areaH/treeH) * 0.97
  const offX = areaX + (areaW - treeW*scale)/2
  const offY = areaY + (areaH - treeH*scale)/2

  ctx.save()
  ctx.translate(offX, offY)
  ctx.scale(scale, scale)

  // Gen labels
  gens.forEach(g=>{
    const y=PAD+g*(NH+VG)
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.font=`700 9px monospace`
    ctx.textAlign='left'; ctx.textBaseline='middle'
    ctx.fillText('GEN '+g, 6, y+NH/2)
  })

  // Couple lines (dashed)
  const drawnC=new Set()
  persons.forEach(p=>{
    if(!p.father_id||!p.mother_id)return
    const key=[p.father_id,p.mother_id].sort().join('|')
    if(drawnC.has(key))return; drawnC.add(key)
    const fp=positions[p.father_id], mp=positions[p.mother_id]
    if(!fp||!mp)return
    const x1=Math.min(fp.x+NW,mp.x+NW), x2=Math.max(fp.x,mp.x)
    if(x2<=x1)return
    ctx.strokeStyle='#5eead4'; ctx.lineWidth=1.5; ctx.setLineDash([6,4])
    ctx.beginPath(); ctx.moveTo(x1,fp.y+NH/2); ctx.lineTo(x2,fp.y+NH/2); ctx.stroke()
    ctx.setLineDash([])
  })

  // Parent→child lines
  persons.forEach(p=>{
    [p.father_id,p.mother_id].filter(Boolean).forEach(par=>{
      const pp=positions[par], cp=positions[p.id]
      if(!pp||!cp)return
      const px=pp.cx, py=pp.y+NH, cx=cp.cx, cy=cp.y, mid=(py+cy)/2
      ctx.strokeStyle='#a7f3e8'; ctx.lineWidth=1.5; ctx.setLineDash([])
      ctx.beginPath(); ctx.moveTo(px,py); ctx.bezierCurveTo(px,mid,cx,mid,cx,cy); ctx.stroke()
    })
  })

  // Nodes
  persons.forEach(p=>{
    const pos=positions[p.id]; if(!pos)return
    p._pos=pos; drawNode(ctx,p)
  })

  ctx.restore()
}

// ── Main export function ───────────────────────────────

export async function exportPoster({ themeId, treeName, memberCount, persons=[], isPremium, format='pdf' }) {
  const theme = POSTER_THEMES.find(t=>t.id===themeId) || POSTER_THEMES[0]
  if (theme.premium && !isPremium) throw new Error('Tema ini khusus untuk pengguna Premium.')
  if (!persons.length) throw new Error('Pohon masih kosong, belum ada anggota.')

  // Poster A3 landscape — 3508×2480 px (tajam, tidak blur)
  const W=3508, H=2480
  const canvas=document.createElement('canvas')
  canvas.width=W; canvas.height=H
  const ctx=canvas.getContext('2d')

  // 1. Background gradient
  const grad=ctx.createLinearGradient(0,0,W,H)
  grad.addColorStop(0,theme.bg[0]); grad.addColorStop(1,theme.bg[1])
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H)

  // 2. Ornamen dekoratif
  drawOrnament(ctx,W,H,theme)

  // 3. Header
  const HY=130
  ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillStyle=theme.accent; ctx.font=`700 64px Georgia,"Times New Roman",serif`
  ctx.fillText('Silsilah Keluarga',W/2,HY)
  ctx.fillStyle=theme.text; ctx.font=`700 110px Georgia,"Times New Roman",serif`
  ctx.fillText(treeName||'Keluarga',W/2,HY+116,W-260)
  ctx.fillStyle=theme.subtext; ctx.font=`38px Georgia,serif`
  ctx.fillText(`${memberCount||persons.length} anggota  ·  sulalah.my.id`,W/2,HY+200)
  ctx.strokeStyle=theme.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.4
  ctx.beginPath(); ctx.moveTo(W/2-340,HY+238); ctx.lineTo(W/2+340,HY+238); ctx.stroke()
  ctx.globalAlpha=1

  // 4. Tree area — panel transparan
  const TREE_Y=HY+270, FOOTER_H=88
  const areaX=90, areaW=W-180, areaH=H-TREE_Y-FOOTER_H-30
  rr(ctx,areaX,TREE_Y-10,areaW,areaH+20,20)
  ctx.fillStyle=theme.treeBg; ctx.fill()
  ctx.strokeStyle=theme.border; ctx.lineWidth=1.5; ctx.stroke()

  // 5. Render pohon LANGSUNG dari data (bukan screenshot)
  renderTree(ctx, persons, areaX+20, TREE_Y+10, areaW-40, areaH)

  // 6. Footer
  ctx.fillStyle=theme.subtext; ctx.font=`28px Georgia,serif`
  ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillText('Sulalah  —  sulalah.my.id  |  Pohon Silsilah Keluarga Muslim',W/2,H-52)

  // 7. Export PDF atau PNG
  const filename=`silsilah-${(treeName||'keluarga').toLowerCase().replace(/\s+/g,'-')}`

  if(format==='pdf'){
    const {jsPDF}=await import('jspdf')
    const pdf=new jsPDF({orientation:'landscape',unit:'px',format:[W,H],hotfixes:['px_scaling']})
    pdf.addImage(canvas.toDataURL('image/jpeg',0.93),'JPEG',0,0,W,H)
    pdf.save(`${filename}.pdf`)
  } else {
    const a=document.createElement('a')
    a.href=canvas.toDataURL('image/png')
    a.download=`${filename}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }
}
