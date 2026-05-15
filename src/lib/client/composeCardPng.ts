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

export async function composeCardPng(
  imgSrc: string,
  headline: string,
  isCover: boolean,
): Promise<Blob> {
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

  const grad = ctx.createLinearGradient(0, H * 0.35, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.6, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const fontSize = Math.round(W * (isCover ? 0.085 : 0.065));
  const lineHeight = Math.round(fontSize * 1.25);
  const padX = Math.round(W * 0.07);
  const padBottom = Math.round(H * 0.08);
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
) {
  try {
    const blob = await composeCardPng(imgSrc, headline, isCover);
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
