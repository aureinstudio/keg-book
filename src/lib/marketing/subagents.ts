/**
 * 코리아교육그룹 출판 마케팅 — 서브에이전트 레지스트리.
 * 웹앱에서 에이전트 모드·라벨·`_output/` 경로 안내에 사용한다.
 * Claude Code 정의(`.claude/agents/*.md`의 `name`·역할)와 필드를 맞춘다.
 */

export const MARKETING_SUBAGENT_IDS = [
  'keg-orchestrator',
  'keg-blog-channel',
  'keg-social-channel',
  'keg-newsletter-channel',
  'keg-cardnews-channel',
  'keg-brand-compliance',
  'keg-seo-schema',
] as const;

export type MarketingSubagentId = (typeof MARKETING_SUBAGENT_IDS)[number];

export interface MarketingSubagentSkillRef {
  readonly skillId: string;
  /** 저장소 루트 기준 경로 */
  readonly repoPath: string;
}

export interface MarketingSubagentDefinition {
  readonly id: MarketingSubagentId;
  readonly slug: string;
  readonly nameKo: string;
  readonly descriptionKo: string;
  /** 소문자 매칭용 키워드(한·영) */
  readonly intentKeywords: readonly string[];
  readonly skills: readonly MarketingSubagentSkillRef[];
  /** `_output/` 아래 상대 경로 (접두 `_output/` 제외) */
  readonly outputRelativeDirs: readonly string[];
  /** `.claude/agents/` 내 파일명 */
  readonly claudeAgentFile: string;
  /** UI 뱃지·포커스 링 등 Tailwind 팔레트 힌트 */
  readonly uiAccent: 'slate' | 'blue' | 'emerald' | 'amber' | 'violet' | 'rose';
}

export const MARKETING_SUBAGENTS: readonly MarketingSubagentDefinition[] = [
  {
    id: 'keg-orchestrator',
    slug: 'orchestrator',
    nameKo: '멀티채널 오케스트레이터',
    descriptionKo:
      '한 캠페인 브리프를 Blogger·네이버·소셜·뉴스레터·카드뉴스로 나누고 저장 경로를 정리한다.',
    intentKeywords: [
      '캠페인',
      '브리프',
      '멀티채널',
      '풀패키지',
      '채널별',
      'orchestrator',
      'campaign brief',
    ],
    skills: [
      { skillId: 'marketing-content', repoPath: '.claude/skills/marketing-content/SKILL.md' },
      { skillId: 'product-marketing-context', repoPath: '.agents/product-marketing-context.md' },
    ],
    outputRelativeDirs: ['shared', 'blogger', 'naver-blog', 'newsletter', 'social-instagram', 'social-threads', 'card-news'],
    claudeAgentFile: 'keg-orchestrator.md',
    uiAccent: 'slate',
  },
  {
    id: 'keg-blog-channel',
    slug: 'blog',
    nameKo: '블로그·검색 채널',
    descriptionKo: 'Blogger·네이버 HTML·온페이지 SEO·메타·FAQ 중심의 장문 콘텐츠.',
    intentKeywords: [
      '블로그',
      'blogger',
      '네이버',
      'naver',
      'seo',
      '메타',
      'slug',
      'h1',
      '온페이지',
    ],
    skills: [
      { skillId: 'blog-seo', repoPath: '.claude/skills/blog-seo/SKILL.md' },
      { skillId: 'seo-audit', repoPath: '.cursor/skills/seo-audit/SKILL.md' },
    ],
    outputRelativeDirs: ['blogger', 'naver-blog'],
    claudeAgentFile: 'keg-blog-channel.md',
    uiAccent: 'blue',
  },
  {
    id: 'keg-social-channel',
    slug: 'social',
    nameKo: '소셜·배포',
    descriptionKo: '인스타그램·Threads 문안과 Buffer 큐용 텍스트.',
    intentKeywords: [
      '인스타',
      'instagram',
      'threads',
      '쓰레드',
      'buffer',
      '버퍼',
      '캡션',
      '소셜',
    ],
    skills: [
      { skillId: 'social-content', repoPath: '.cursor/skills/social-content/SKILL.md' },
      { skillId: 'copywriting', repoPath: '.cursor/skills/copywriting/SKILL.md' },
    ],
    outputRelativeDirs: ['social-instagram', 'social-threads'],
    claudeAgentFile: 'keg-social-channel.md',
    uiAccent: 'emerald',
  },
  {
    id: 'keg-newsletter-channel',
    slug: 'newsletter',
    nameKo: '뉴스레터(메일리)',
    descriptionKo: '메일리 스토리·Q&A·HTML·제목 라인.',
    intentKeywords: ['뉴스레터', 'newsletter', '메일리', 'maily', '이메일', '제목줄'],
    skills: [
      { skillId: 'marketing-content', repoPath: '.claude/skills/marketing-content/SKILL.md' },
    ],
    outputRelativeDirs: ['newsletter'],
    claudeAgentFile: 'keg-newsletter-channel.md',
    uiAccent: 'violet',
  },
  {
    id: 'keg-cardnews-channel',
    slug: 'cardnews',
    nameKo: '카드뉴스·비주얼',
    descriptionKo: '슬라이드 기획·Gemini 프롬프트·`_template/card-news/` 정합.',
    intentKeywords: ['카드뉴스', '슬라이드', 'gemini', '이미지', '캐러셀', 'card news'],
    skills: [{ skillId: 'marketing-content', repoPath: '.claude/skills/marketing-content/SKILL.md' }],
    outputRelativeDirs: ['card-news'],
    claudeAgentFile: 'keg-cardnews-channel.md',
    uiAccent: 'amber',
  },
  {
    id: 'keg-brand-compliance',
    slug: 'compliance',
    nameKo: '브랜드·컴플라이언스',
    descriptionKo: '톤·금지 표현·표시광고·교육 리스크 검수 게이트.',
    intentKeywords: ['검수', '금지', '컴플라이언스', '톤', '브랜드', '법무', '리스크', 'compliance'],
    skills: [{ skillId: 'product-marketing-context', repoPath: '.agents/product-marketing-context.md' }],
    outputRelativeDirs: ['shared'],
    claudeAgentFile: 'keg-brand-compliance.md',
    uiAccent: 'rose',
  },
  {
    id: 'keg-seo-schema',
    slug: 'schema',
    nameKo: '구조화 데이터',
    descriptionKo: 'JSON-LD·schema.org·리치 결과용 마크업 초안.',
    intentKeywords: ['json-ld', 'schema', '구조화', '리치', 'snippet', 'article'],
    skills: [{ skillId: 'schema-markup', repoPath: '.cursor/skills/schema-markup/SKILL.md' }],
    outputRelativeDirs: ['shared', 'blogger'],
    claudeAgentFile: 'keg-seo-schema.md',
    uiAccent: 'blue',
  },
];

export function getMarketingSubagentById(
  id: string,
): MarketingSubagentDefinition | undefined {
  return MARKETING_SUBAGENTS.find((s) => s.id === id);
}

/** 간단 키워드 스코어 — UI에서 에이전트 추천·자동 선택에 사용 */
export function matchMarketingSubagentsByQuery(
  query: string,
  limit = 4,
): MarketingSubagentDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = MARKETING_SUBAGENTS.map((def) => {
    let score = 0;
    if (q.includes(def.id.toLowerCase())) score += 8;
    for (const kw of def.intentKeywords) {
      if (q.includes(kw.toLowerCase())) score += 3;
    }
    return { def, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.def);
}
