import { ChevronRight } from "lucide-react";

export default function ActivityCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href?: string;
}) {
  const content = (
    <div
      className="
        flex items-center gap-3
        w-full
        rounded-2xl
        border border-white/10
        bg-[#181719]
        px-4 py-3
        transition hover:bg-[#222124]
      "
    >
      {/* Icon */}
      <div
        className="
          flex h-11 w-11 shrink-0
          items-center justify-center
          rounded-full
          bg-[#2a2020]
          text-lg
          text-ungu
        "
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="mt-0.5 text-xs text-white-200">{description}</p>
      </div>

      {/* Arrow */}
      <span className="shrink-0 text-xl text-gray-400">
        <ChevronRight size={20} aria-hidden="true" />
      </span>
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
}
