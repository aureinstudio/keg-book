import Image from "next/image";

type Props = {
  /** px 단위. 가로/세로 기본은 정사각 컨테이너 안에 fit. */
  size?: number;
  className?: string;
  /** 모드별 강제 색 (테스트용). 기본은 다크모드 토글에 자동 반응. */
  variant?: "auto" | "black" | "white";
  alt?: string;
};

export function BrandLogo({
  size = 28,
  className,
  variant = "auto",
  alt = "keg-book",
}: Props) {
  if (variant === "black") {
    return (
      <Image
        src="/logo_bk.png"
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "contain" }}
        priority
      />
    );
  }
  if (variant === "white") {
    return (
      <Image
        src="/logo_wh.png"
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "contain" }}
        priority
      />
    );
  }

  return (
    <>
      <Image
        src="/logo_bk.png"
        alt={alt}
        width={size}
        height={size}
        className={`${className ?? ""} dark:hidden`}
        style={{ objectFit: "contain" }}
        priority
      />
      <Image
        src="/logo_wh.png"
        alt={alt}
        width={size}
        height={size}
        className={`${className ?? ""} hidden dark:block`}
        style={{ objectFit: "contain" }}
        priority
      />
    </>
  );
}
