# `_output/` — 매체별 산출물

에이전트·스크립트·앱이 만든 **캠페인별 생성물**을 매체(채널)별로 나눠 둡니다.  
**고정 템플릿·레퍼런스**는 `_template/`에만 둡니다.

## 폴더 맵

| 경로 | 용도 |
|------|------|
| `blogger/` | Blogger 발행용 본문(Markdown/HTML)·메타·태그 초안 |
| `naver-blog/` | 네이버 붙여넣기용 HTML·체크리스트 |
| `newsletter/` | 메일리용 Markdown/HTML·제목 라인 |
| `social-instagram/` | 인스타 캡션·캐러셀 문안·해시태그 블록 |
| `social-threads/` | Threads 스레드 분할 텍스트 |
| `card-news/` | Gemini 생성 이미지·프롬프트 로그·슬라이드 순서 메모 |
| `shared/` | 채널 공통 원고·브리프·보내기 JSON 등 |

필요하면 하위에 `YYYY-MM-DD_캠페인슬러그/` 서브폴더를 두어도 된다.

## 파일명 권장

```
{YYYY-MM-DD}_{campaign-slug}_{짧은설명}.{확장자}
```

예: `2026-05-10_spring-sale_blog-blogger.md`

## Git

- 텍스트·소형 JSON은 커밋해도 된다.
- 대용량 이미지·동영상은 루트 `.gitignore`에서 `_output/**` 일부 확장자를 제외하도록 해 두었다. 팀 정책에 맞게 조정한다.
