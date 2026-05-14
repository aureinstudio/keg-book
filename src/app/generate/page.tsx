import { GenerateWorkbench } from "./GenerateWorkbench";

export const metadata = {
  title: "콘텐츠 생성 — keg-book",
  description: "키워드 하나로 전 채널 마케팅 콘텐츠를 자동 생성합니다.",
};

export default function GeneratePage() {
  return <GenerateWorkbench />;
}
