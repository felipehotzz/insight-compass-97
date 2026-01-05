import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContactTooltipProps {
  icon: React.ReactNode;
  value: string;
  href?: string;
}

export function ContactTooltip({ icon, value, href }: ContactTooltipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a 
          href={href} 
          target={href?.startsWith("https") ? "_blank" : undefined}
          rel={href?.startsWith("https") ? "noopener noreferrer" : undefined}
          className="hover:text-foreground transition-colors"
        >
          {icon}
        </a>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="flex items-center gap-2 bg-popover border border-border"
      >
        <span className="text-sm">{value}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-secondary transition-colors"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </TooltipContent>
    </Tooltip>
  );
}
