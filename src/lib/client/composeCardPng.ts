// 클라이언트 전용: Canvas로 카드뉴스 이미지 + 한글 헤드라인 합성

function wrapKoreanText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** 카드뉴스 합성 옵션 — 모두 선택적. 기본값은 기존 동작과 동일. */
export type CardComposeOptions = {
  /** 헤드라인 글자 크기 배율. 0.5 ~ 1.6 권장 (기본 1) */
  fontScale?: number;
  /** 헤드라인 마지막 줄을 이미지 하단에서 얼마나 위로 띄울지(이미지 높이 비율).
   *  0.04 ~ 0.4 권장 (기본 0.08) */
  bottomOffset?: number;
  /** 하단 어둠 그라데이션 강도. 0 = 그라데이션 없음, 1 = 기본 (기본 1) */
  gradientStrength?: number;
};

const DEFAULT_FONT_SCALE = 1;
const DEFAULT_BOTTOM_OFFSET = 0.08;
const DEFAULT_GRADIENT_STRENGTH = 1;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export async function composeCardPng(
  imgSrc: string,
  headline: string,
  isCover: boolean,
  options?: CardComposeOptions,
): Promise<Blob> {
  const fontScale = clamp(options?.fontScale ?? DEFAULT_FONT_SCALE, 0.5, 1.6);
  const bottomOffset = clamp(
    options?.bottomOffset ?? DEFAULT_BOTTOM_OFFSET,
    0.02,
    0.45,
  );
  const gradStrength = clamp(
    options?.gradientStrength ?? DEFAULT_GRADIENT_STRENGTH,
    0,
    1,
  );

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다"));
    img.src = imgSrc;
  });

  const W = img.naturalWidth || 1080;
  const H = img.naturalHeight || Math.round((W * 5) / 4);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 컨텍스트를 만들 수 없습니다");

  ctx.drawImage(img, 0, 0, W, H);

  if (gradStrength > 0) {
    const grad = ctx.createLinearGradient(0, H * 0.35, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.6, `rgba(0,0,0,${(0.55 * gradStrength).toFixed(3)})`);
    grad.addColorStop(1, `rgba(0,0,0,${(0.85 * gradStrength).toFixed(3)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  const fontSize = Math.round(W * (isCover ? 0.085 : 0.065) * fontScale);
  const lineHeight = Math.round(fontSize * 1.25);
  const padX = Math.round(W * 0.07);
  const padBottom = Math.round(H * bottomOffset);
  const maxWidth = W - padX * 2;

  ctx.font = `700 ${fontSize}px "Pretendard","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = Math.round(fontSize * 0.25);
  ctx.shadowOffsetY = Math.round(fontSize * 0.05);

  const lines = wrapKoreanText(ctx, headline, maxWidth);
  const startY = H - padBottom - lineHeight * (lines.length - 1);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], padX, startY + lineHeight * i);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG 변환 실패"))),
      "image/png",
      0.95,
    );
  });
}

export async function downloadComposedCard(
  imgSrc: string,
  headline: string,
  isCover: boolean,
  filename: string,
  options?: CardComposeOptions,
) {
  try {
    const blob = await composeCardPng(imgSrc, headline, isCover, options);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error(e);
    const a = document.createElement("a");
    a.href = imgSrc;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

// ─────────────────────────────────────────────────────────────
// ZIP (store, no compression) — 의존성 없이 다중 파일 묶음 다운로드
// ─────────────────────────────────────────────────────────────

let CRC_TABLE: Uint32Array | null = null;
function getCrcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}
function crc32(buf: Uint8Array): number {
  const t = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d: Date = new Date()): { date: number; time: number } {
  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0xf) << 5) |
    (d.getDate() & 0x1f);
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((d.getSeconds() >> 1) & 0x1f);
  return { date, time };
}

function strToUtf8Bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** store-only ZIP을 만들어 Blob으로 반환. PNG처럼 이미 압축된 파일에 최적. */
export async function buildZip(
  files: { name: string; data: Uint8Array | Blob }[],
): Promise<Blob> {
  const { date, time } = dosDateTime();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const data =
      f.data instanceof Blob
        ? new Uint8Array(await f.data.arrayBuffer())
        : f.data;
    const nameBytes = strToUtf8Bytes(f.name);
    const crc = crc32(data);

    // Local File Header (30 bytes + name)
    const lfh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lfh.buffer);
    lv.setUint32(0, 0x04034b50, true); // sig
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // gp bit 11 = UTF-8 name
    lv.setUint16(8, 0, true); // method = 0 (store)
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true); // compressed
    lv.setUint32(22, data.length, true); // uncompressed
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    lfh.set(nameBytes, 30);
    parts.push(lfh, data);

    // Central Directory File Header (46 bytes + name)
    const cdh = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdh.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 0x031e, true); // version made by (UNIX, zip 3.0)
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true); // ext attrs
    cv.setUint32(42, offset, true); // LFH offset
    cdh.set(nameBytes, 46);
    central.push(cdh);

    offset += lfh.length + data.length;
  }

  const centralSize = central.reduce((s, x) => s + x.length, 0);
  const centralOffset = offset;

  // EOCD
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralOffset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...parts, ...central, eocd] as BlobPart[], {
    type: "application/zip",
  });
}

export type ZipSlideInput = {
  imgSrc: string;
  headline: string;
  isCover: boolean;
  filename: string;
  options?: CardComposeOptions;
};

/** 카드뉴스 슬라이드들을 합성 → ZIP으로 묶어 한 번에 다운로드. */
export async function downloadComposedCardsAsZip(
  slides: ZipSlideInput[],
  zipFilename: string,
): Promise<void> {
  if (slides.length === 0) return;
  const blobs = await Promise.all(
    slides.map(async (s) => ({
      name: s.filename,
      data: await composeCardPng(s.imgSrc, s.headline, s.isCover, s.options),
    })),
  );
  const zip = await buildZip(blobs);
  const url = URL.createObjectURL(zip);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
