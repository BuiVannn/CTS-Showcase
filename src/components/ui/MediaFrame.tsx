import Image from "next/image";

export default function MediaFrame({
  src,
  alt,
  ratio = "16 / 9",
  className = "",
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
    </div>
  );
}
