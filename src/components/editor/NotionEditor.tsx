import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Type,
  Link as LinkIcon,
  Video,
  List,
  Plus,
  X,
  Play,
  ExternalLink,
} from "lucide-react";

interface Block {
  id: string;
  type: "text" | "link" | "video";
  content: string;
}

interface NotionEditorProps {
  onChange?: (blocks: Block[]) => void;
  initialContent?: string;
}

const getVideoEmbed = (url: string): { type: "youtube" | "loom" | "google" | "other"; embedUrl: string } | null => {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) {
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }
  
  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([^?\s]+)/);
  if (loomMatch) {
    return { type: "loom", embedUrl: `https://www.loom.com/embed/${loomMatch[1]}` };
  }
  
  // Google Meet recordings (drive)
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/\s]+)/);
  if (driveMatch) {
    return { type: "google", embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  // Check if it's likely a video link
  if (url.includes("meet.google.com") || url.includes("zoom.us") || url.includes("teams.microsoft.com")) {
    return { type: "other", embedUrl: url };
  }

  return null;
};

const getLinkPreview = (url: string) => {
  try {
    const urlObj = new URL(url);
    return {
      domain: urlObj.hostname.replace("www.", ""),
      favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`,
    };
  } catch {
    return { domain: url, favicon: "" };
  }
};

export function NotionEditor({ onChange, initialContent }: NotionEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    // Try to parse as JSON blocks first
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // If not JSON, treat as plain text content
        return [{ id: "1", type: "text" as const, content: initialContent }];
      }
    }
    return [{ id: "1", type: "text", content: "" }];
  });
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onChange?.(blocks);
  }, [blocks, onChange]);

  const addBlock = (type: Block["type"], content = "") => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content,
    };
    setBlocks([...blocks, newBlock]);
    setShowMenu(false);
    setShowLinkInput(false);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const removeBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter((b) => b.id !== id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === "/" && blocks.find((b) => b.id === blockId)?.content === "") {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (editorRect) {
        setMenuPosition({
          top: rect.bottom - editorRect.top + 8,
          left: 0,
        });
      }
      setActiveBlockId(blockId);
      setShowMenu(true);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlock("text");
    } else if (e.key === "Backspace") {
      const block = blocks.find((b) => b.id === blockId);
      if (block?.content === "" && blocks.length > 1) {
        e.preventDefault();
        removeBlock(blockId);
      }
    }
  };

  const handleAddLink = () => {
    if (linkInput.trim()) {
      const videoEmbed = getVideoEmbed(linkInput);
      if (videoEmbed) {
        addBlock("video", linkInput);
      } else {
        addBlock("link", linkInput);
      }
      setLinkInput("");
    }
  };

  const menuItems = [
    { type: "text" as const, icon: Type, label: "Texto", description: "Parágrafo de texto" },
    { type: "link" as const, icon: LinkIcon, label: "Link", description: "Adicionar um link com preview" },
    { type: "video" as const, icon: Video, label: "Vídeo", description: "Embed de vídeo/reunião" },
  ];

  return (
    <div ref={editorRef} className="relative">
      {/* Blocks */}
      <div className="space-y-3">
        {blocks.map((block) => (
          <div key={block.id} className="group relative">
            {/* Add button */}
            <button
              onClick={() => {
                setActiveBlockId(block.id);
                setShowMenu(true);
                setMenuPosition({ top: 0, left: 0 });
              }}
              className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>

            {block.type === "text" && (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                placeholder="Digite '/' para comandos..."
                className="w-full bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder:text-muted-foreground/40 min-h-[28px]"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
            )}

            {block.type === "link" && (
              <a
                href={block.content}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors group/link"
              >
                <img
                  src={getLinkPreview(block.content).favicon}
                  alt=""
                  className="w-6 h-6 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{block.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {getLinkPreview(block.content).domain}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover/link:opacity-100 transition-opacity" />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeBlock(block.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </a>
            )}

            {block.type === "video" && (
              <div className="relative group/video">
                <button
                  onClick={() => removeBlock(block.id)}
                  className="absolute -right-2 -top-2 z-10 opacity-0 group-hover/video:opacity-100 transition-opacity bg-secondary rounded-full p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                {(() => {
                  const embed = getVideoEmbed(block.content);
                  if (embed && embed.type !== "other") {
                    return (
                      <div className="aspect-video rounded-lg overflow-hidden border border-border">
                        <iframe
                          src={embed.embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  }
                  return (
                    <a
                      href={block.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                        <Play className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Gravação da reunião</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {block.content}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowMenu(false);
              setShowLinkInput(false);
            }}
          />
          <div
            className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-2 w-64"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {showLinkInput ? (
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Cole o link (YouTube, Loom, Google Meet, etc.)
                </p>
                <div className="flex gap-2">
                  <Input
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://..."
                    className="text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddLink();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddLink}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Blocos básicos
                </p>
                {menuItems.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      if (item.type === "link" || item.type === "video") {
                        setShowLinkInput(true);
                      } else {
                        addBlock(item.type);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
