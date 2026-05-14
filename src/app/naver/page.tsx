import type { Metadata } from "next";
import { NaverExportPanel } from "./NaverExportPanel";

export const metadata: Metadata = { title: "네이버 블로그 — keg-book" };

export default function NaverAssistPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-16">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ backgroundColor: "#03C75A" }}>N</span>
        <div>
          <h1 className="text-[18px] font-normal" style={{ color: "var(--color-text)" }}>네이버 블로그</h1>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>공식 API 없음 — HTML 생성 · 복사 보조 · 수동 게시</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "20px" }}>
          <NaverExportPanel />
        </div>

        {/* 체크리스트 */}
        <div style={{ backgroundColor: "rgba(249,171,0,0.06)", border: "1px solid rgba(249,171,0,0.2)", borderRadius: "12px", padding: "18px 20px" }}>
          <h2 className="mb-3 text-[13px] font-medium" style={{ color: "#B45309" }}>발행 전 체크리스트</h2>
          <ul className="space-y-2.5">
            {[
              "네이버 블로그 글쓰기에서 HTML·소스 붙여넣기 모드 확인",
              "이미지는 네이버 업로드 또는 정책에 맞는 외부 링크로 처리",
              "표기광고·저작권·교재 표기 등 내부 가이드 반영",
              "미리보기에서 깨진 태그·링크 없는지 확인",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: "#B45309" }}>
                <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: "#F9AB00" }}>
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
