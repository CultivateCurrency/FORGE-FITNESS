"use client";

import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Trigger onChange after command
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  }, [execCommand]);

  const ToolbarButton = ({
    icon: Icon,
    command,
    label,
    onClick,
  }: {
    icon: React.ElementType;
    command?: string;
    label: string;
    onClick?: () => void;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
      title={label}
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent losing selection
        if (onClick) {
          onClick();
        } else if (command) {
          execCommand(command);
        }
      }}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-zinc-700 bg-zinc-850">
        <ToolbarButton icon={Bold} command="bold" label="Bold" />
        <ToolbarButton icon={Italic} command="italic" label="Italic" />
        <ToolbarButton icon={Underline} command="underline" label="Underline" />
        <div className="w-px h-5 bg-zinc-700 mx-1" />
        <ToolbarButton icon={Heading1} label="Heading 1" onClick={() => execCommand("formatBlock", "h1")} />
        <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => execCommand("formatBlock", "h2")} />
        <div className="w-px h-5 bg-zinc-700 mx-1" />
        <ToolbarButton icon={List} command="insertUnorderedList" label="Bullet List" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" label="Numbered List" />
        <div className="w-px h-5 bg-zinc-700 mx-1" />
        <ToolbarButton icon={AlignLeft} command="justifyLeft" label="Align Left" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" label="Align Center" />
        <div className="w-px h-5 bg-zinc-700 mx-1" />
        <ToolbarButton icon={LinkIcon} label="Insert Link" onClick={handleLink} />
        <div className="w-px h-5 bg-zinc-700 mx-1" />
        <ToolbarButton icon={Undo} command="undo" label="Undo" />
        <ToolbarButton icon={Redo} command="redo" label="Redo" />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="p-4 text-sm text-white leading-relaxed outline-none prose prose-invert prose-sm max-w-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #52525b;
          pointer-events: none;
        }
        [contenteditable] h1 {
          font-size: 1.5em;
          font-weight: 700;
          margin: 0.5em 0;
          color: white;
        }
        [contenteditable] h2 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.5em 0;
          color: white;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        [contenteditable] li {
          margin: 0.25em 0;
        }
        [contenteditable] a {
          color: #f97316;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
