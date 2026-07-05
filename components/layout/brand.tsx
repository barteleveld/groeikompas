import Image from "next/image";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="GroeiKompas">
      <Image
        src="/groeikompas-favicon.png"
        alt=""
        width={44}
        height={44}
        className="size-10 rounded-xl shadow-sm"
        priority
      />
      {!compact && <span className="brand-word text-xl font-black tracking-tight">GroeiKompas</span>}
    </span>
  );
}

export function BrandLogo() {
  return (
    <div className="brand-lockup" aria-label="GroeiKompas">
      <Image
        src="/groeikompas-logo.png"
        alt=""
        width={1453}
        height={1118}
        priority
      />
    </div>
  );
}
