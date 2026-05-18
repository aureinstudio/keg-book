import type { Metadata } from "next";
import { NaverExportPanel } from "./NaverExportPanel";
import { PrefillFromGeneration } from "../PrefillFromGeneration";
import { getGeneration } from "@/lib/db/generations";

export const metadata: Metadata = { title: "네이버 블로그 — keg-book" };

type SearchParams = { from?: string };

export default async function NaverAssistPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const fromId = sp.from;

  // /generate에서 넘어온 경우 — 네이버 초안 자동 프리필
  let initialTitle: string | undefined;
  let initialDescription: string | undefined;
  let initialBody: string | undefined;
  let initialTags: string[] | undefined;

  if (fromId) {
    const gen = await getGeneration(fromId).catch(() => null);
    const naver = (gen?.raw_json as Record<string, unknown> | undefined)?.naver as
      | { title?: string; description?: string; content_html?: string; tags?: string[] }
      | undefined;
    if (naver) {
      initialTitle = naver.title;
      initialDescription = naver.description;
      initialBody = naver.content_html;
      initialTags = naver.tags;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-16">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#525252" }}>N</span>
        <div>
          <h1 className="text-[18px] font-normal" style={{ color: "var(--color-text)" }}>네이버 블로그</h1>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>공식 API 없음 — HTML 생성 · 복사 보조 · 수동 게시</p>
        </div>
      </div>

      <PrefillFromGeneration channel="naver" basePath="/naver" fromId={fromId} />

      <div className="flex flex-col gap-4">
        <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "20px" }}>
          <NaverExportPanel
            initialTitle={initialTitle}
            initialDescription={initialDescription}
            initialBody={initialBody}
            initialTags={initialTags}
            generationId={fromId}
          />
        </div>

        {/* 체크리스트 */}
        <div style={{ backgroundColor: "rgba(115,115,115,0.06)", border: "1px solid rgba(115,115,115,0.2)", borderRadius: "12px", padding: "18px 20px" }}>
          <h2 className="mb-3 text-[13px] font-medium" style={{ color: "#525252" }}>발행 전 체크리스트</h2>
          <ul className="space-y-2.5">
            {[
              "네이버 블로그 글쓰기에서 HTML·소스 붙여넣기 모드 확인",
              "이미지는 네이버 업로드 또는 정책에 맞는 외부 링크로 처리",
              "표기광고·저작권·교재 표기 등 내부 가이드 반영",
              "미리보기에서 깨진 태그·링크 없는지 확인",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: "#525252" }}>
                <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: "#737373" }}>
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[12px]" style={{ color: "var(--color-text-faint)" }}>
          OAuth·.env 없이 동작합니다.
        </p>
      </div>
    </div>
  );
}
