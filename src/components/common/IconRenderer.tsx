import AiAvatar from "@/components/chatdock/AiAvatar";

/**
 * IconRenderer - Renders icon based on icon name
 * Special case: "smart_toy" renders AiAvatar instead of material icon
 */

interface IconRendererProps {
  icon: string;
  className?: string;
}

export default function IconRenderer({ icon, className = "" }: IconRendererProps) {
  if (icon === "smart_toy") {
    return <AiAvatar className="w-full h-full" />;
  }

  return (
    <span className={`material-symbols-outlined ${className}`}>
      {icon}
    </span>
  );
}
