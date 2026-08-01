"use client";

import { useState, useRef } from "react";
import { FontWithCount, Bubble } from "@/app/types/comic";
import { Plus, Trash2, Edit2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  fontSizeToPx,
  pxToFontSize,
} from "./bubbleCoordinates";
import {
  DIALOGUE_TOKENS,
  DIALOGUE_TOKEN_LABELS,
  findInvalidTokens,
  substituteTokens,
  SAMPLE_NAMES,
  SAMPLE_PRONOUNS,
} from "@/lib/dialogueTokens";

// Local state representation before saving
export interface LocalBubble extends Partial<Bubble> {
  id: string; // can be temporary "new-1" etc
  isNew?: boolean;
  isDeleted?: boolean;
  isModified?: boolean;
}

interface BubbleSidebarProps {
  bubbles: LocalBubble[];
  /** Real Sharp-probed artwork height, so the px the admin types is the px that prints. */
  artworkHeight: number;
  selectedBubbleId: string | null;
  onSelectBubble: (id: string) => void;
  onAddBubble: () => void;
  onUpdateBubble: (id: string, updates: Partial<LocalBubble>) => void;
  onDeleteBubble: (id: string) => void;
  fonts: FontWithCount[];
}

export function BubbleSidebar({
  bubbles,
  artworkHeight,
  selectedBubbleId,
  onSelectBubble,
  onAddBubble,
  onUpdateBubble,
  onDeleteBubble,
  fonts
}: BubbleSidebarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewLongName, setPreviewLongName] = useState(true);

  const activeBubbles = bubbles.filter(b => !b.isDeleted);
  const selectedBubble = activeBubbles.find(b => b.id === selectedBubbleId);

  const invalidTokens = selectedBubble ? findInvalidTokens(selectedBubble.dialogue || "") : [];
  const previewName = previewLongName ? SAMPLE_NAMES.long : SAMPLE_NAMES.short;
  const previewText = selectedBubble ? substituteTokens(selectedBubble.dialogue || "", previewName, SAMPLE_PRONOUNS) : "";

  const insertTokenAtCursor = (token: string) => {
    if (!selectedBubble) return;
    const el = textareaRef.current;
    if (!el) {
      onUpdateBubble(selectedBubble.id, { dialogue: (selectedBubble.dialogue || "") + token });
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = selectedBubble.dialogue || "";
    const newValue = current.substring(0, start) + token + current.substring(end);
    onUpdateBubble(selectedBubble.id, { dialogue: newValue });
    
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div className="w-80 shrink-0 bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      
      <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-white/50">
        <div>
          <h3 className="font-bold text-neutral-900">Bubbles</h3>
          <p className="text-xs text-neutral-500">{activeBubbles.length} total</p>
        </div>
        <Button
          onClick={onAddBubble}
          disabled={fonts.length === 0}
          title={
            fonts.length === 0
              ? "Upload a font on the Fonts tab before mapping bubbles"
              : undefined
          }
          size="sm"
          className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {activeBubbles.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {fonts.length === 0 ? (
              <>
                <p className="text-sm text-amber-600 font-medium">No fonts uploaded.</p>
                <p className="text-xs">
                  Add a font on the Fonts tab before mapping bubbles.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm">No bubbles yet.</p>
                <p className="text-xs">Click Add to create one.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activeBubbles.map((bubble, i) => (
              <div 
                key={bubble.id}
                onClick={() => onSelectBubble(bubble.id)}
                className={cn(
                  "p-3 rounded-2xl border transition-all cursor-pointer relative group",
                  selectedBubbleId === bubble.id
                    ? "border-[#914A8C] bg-[#914A8C]/5 shadow-sm ring-1 ring-[#914A8C]/20"
                    : !bubble.dialogue?.trim()
                      // Empty dialogue is rejected by the backend, so flag it as an
                      // error state rather than letting it read as a placeholder.
                      ? "border-red-300 bg-red-50/50 hover:border-red-400"
                      : "border-neutral-200 bg-white hover:border-[#914A8C]/30"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                    Bubble {i + 1} {bubble.isNew && <span className="text-emerald-500 ml-1">New</span>}
                    {bubble.isModified && !bubble.isNew && <span className="text-amber-500 ml-1">*</span>}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteBubble(bubble.id); }}
                    className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <p className="text-sm text-neutral-800 line-clamp-2 leading-tight">
                  {bubble.dialogue?.trim() || (
                    <span className="text-red-500 italic font-medium">
                      Empty dialogue — add text or delete
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Editor Panel for Selected Bubble */}
      {selectedBubble ? (
        <div className="p-4 border-t border-neutral-100 bg-white/90">
          <h4 className="font-bold text-sm text-neutral-900 mb-3 flex items-center">
            <Edit2 className="w-4 h-4 mr-2 text-[#914A8C]" /> Edit Selected
          </h4>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700">Dialogue</Label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {DIALOGUE_TOKENS.map(token => (
                  <button
                    key={token}
                    onClick={() => insertTokenAtCursor(token)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#914A8C]/10 text-[#914A8C] hover:bg-[#914A8C]/20 font-medium transition-colors border border-[#914A8C]/15"
                  >
                    {DIALOGUE_TOKEN_LABELS[token as keyof typeof DIALOGUE_TOKEN_LABELS]}
                  </button>
                ))}
                <span className="text-[10px] text-neutral-400 ml-auto">Click to insert at cursor</span>
              </div>
              <Textarea 
                ref={textareaRef}
                value={selectedBubble.dialogue || ""}
                onChange={(e) => onUpdateBubble(selectedBubble.id, { dialogue: e.target.value })}
                placeholder="Enter text..."
                className="text-sm rounded-xl resize-none h-24 bg-neutral-50 border-neutral-200 focus-visible:ring-[#914A8C]"
              />
              {invalidTokens.length > 0 && (
                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-1.5">
                  ⚠ Unknown token(s): {invalidTokens.map(t => <code key={t} className="bg-amber-100 px-1 rounded mx-0.5">{t}</code>)}
                  <div className="mt-1 text-amber-600/80">Valid: {DIALOGUE_TOKENS.join(", ")}</div>
                </div>
              )}
              
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Preview</span>
                  <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                    <button
                      onClick={() => setPreviewLongName(false)}
                      className={cn("text-[10px] px-2 py-0.5 rounded-md transition-colors", !previewLongName ? "bg-white shadow-sm text-neutral-900 font-medium" : "text-neutral-500 hover:text-neutral-700")}
                    >
                      Short
                    </button>
                    <button
                      onClick={() => setPreviewLongName(true)}
                      className={cn("text-[10px] px-2 py-0.5 rounded-md transition-colors", previewLongName ? "bg-white shadow-sm text-neutral-900 font-medium" : "text-neutral-500 hover:text-neutral-700")}
                    >
                      Long
                    </button>
                  </div>
                </div>
                <div className="text-xs text-neutral-800 bg-neutral-100 border border-neutral-200 rounded-lg p-2.5 leading-relaxed italic min-h-[2.5rem]">
                  {previewText ? previewText : <span className="text-neutral-400">(no dialogue)</span>}
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 text-right">
                  {previewText.length} chars after substitution
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">Font</Label>
                <Select 
                  value={selectedBubble.fontId || ""}
                  onValueChange={(val) => onUpdateBubble(selectedBubble.id, { fontId: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-neutral-50 border-neutral-200">
                    <SelectValue placeholder="Select...">
                      {fonts.find(f => f.id === selectedBubble.fontId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {fonts.map(f => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">Font Size</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={Math.ceil(MIN_FONT_SIZE * artworkHeight)}
                    max={Math.floor(MAX_FONT_SIZE * artworkHeight)}
                    value={Math.round(
                      fontSizeToPx(selectedBubble.fontSize ?? DEFAULT_FONT_SIZE, artworkHeight)
                    )}
                    onChange={(e) => {
                      const px = parseFloat(e.target.value);
                      if (!px) return;
                      onUpdateBubble(selectedBubble.id, { fontSize: pxToFontSize(px, artworkHeight) });
                    }}
                    className="h-9 text-xs rounded-xl bg-neutral-50 border-neutral-200"
                  />
                  <span className="text-xs text-neutral-500 font-medium">px</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-neutral-500 font-mono bg-neutral-50 p-2 rounded-lg border border-neutral-100 flex flex-wrap gap-2 justify-between">
               <span>x: {selectedBubble.x?.toFixed(4)}</span>
               <span>y: {selectedBubble.y?.toFixed(4)}</span>
               <span>w: {selectedBubble.width?.toFixed(4)}</span>
               <span>h: {selectedBubble.height?.toFixed(4)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 text-center h-[280px] flex items-center justify-center">
           <p className="text-sm text-neutral-500 font-medium">Select a bubble on the canvas or list to edit properties.</p>
        </div>
      )}
    </div>
  );
}
