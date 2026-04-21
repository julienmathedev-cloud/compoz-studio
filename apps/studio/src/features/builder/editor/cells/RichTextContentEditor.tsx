"use client";

/**
 * @file apps/studio/src/features/builder/editor/cells/RichTextContentEditor.tsx
 * @layer ui/studio/pages/blocks/editor
 *
 * @description
 * Éditeur de contenu Rich Text (Tiptap) — UI pure.
 *
 * @remarks
 * - Contrôlé : le parent fournit `value` (HTML) et reçoit `onChange` (HTML).
 * - Toolbar type "Simple Editor" : icônes + groupes (marks, blocks, align, history, link).
 * - Aucun couplage direct à RHF : ce composant ne gère que l’édition du contenu riche.
 */

import { Extension } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  TextQuote,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Button } from "@compoz/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@compoz/ui/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupInput,
} from "@compoz/ui/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@compoz/ui/components/ui/popover";
import { Separator } from "@compoz/ui/components/ui/separator";
import { Toggle } from "@compoz/ui/components/ui/toggle";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@compoz/ui/components/ui/toggle-group";
import { cn } from "@compoz/ui/lib/utils";
import { PROSE_CLASSNAME } from "@compoz/ui/styles/shared/typography";
import { STACK_MD, STUDIO_BORDER_PANEL } from "@compoz/ui/styles/studio/layout";

export type RichTextContentEditorProps = Readonly<{
  /** HTML du contenu (source de vérité). */
  value: string;
  /** Désactive l’édition. */
  disabled?: boolean;
  /** Remonte le HTML à chaque update. */
  onChange: (nextHtml: string) => void;

  /** Optionnel : placeholder d’édition. */
  placeholder?: string;
  /** Optionnel : hint sous l’éditeur. */
  hint?: string;

  /** Optionnel : className container */
  className?: string;
}>;

type BlockKind = "list" | "blockquote";

/**
 * Gère explicitement Tab / Shift+Tab pour empêcher la perte de focus.
 *
 * Règles :
 * - Dans une liste :
 *   - Tab = indent si possible
 *   - Shift+Tab = outdent si possible
 * - Hors liste :
 *   - Tab insère un caractère "\t"
 * - Dans tous les cas gérés ici :
 *   - on empêche le comportement natif du navigateur
 */
const TabKeymap = Extension.create({
  name: "tabKeymap",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("rich-text-tab-keymap"),
        props: {
          handleKeyDown: (_view, event) => {
            if (event.key !== "Tab") return false;
            if (!this.editor.isEditable) return false;

            event.preventDefault();

            if (this.editor.isActive("listItem")) {
              if (event.shiftKey) {
                const handled = this.editor
                  .chain()
                  .focus()
                  .liftListItem("listItem")
                  .run();

                return handled || true;
              }

              const handled = this.editor
                .chain()
                .focus()
                .sinkListItem("listItem")
                .run();

              return handled || true;
            }

            if (event.shiftKey) {
              return true;
            }

            this.editor
              .chain()
              .focus()
              .insertContent("\u00A0\u00A0\u00A0\u00A0")
              .run();
            return true;
          },
        },
      }),
    ];
  },
});

const EnhancedLink = Link.extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("linkClickHandler"),
        props: {
          handleClick: (view, _pos, event) => {
            if (!view.editable) return false;

            const target = event.target as HTMLElement | null;
            const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
            if (!anchor) return false;

            const href =
              anchor.getAttribute("href") ?? anchor.getAttribute("data-href");
            if (!href) return true;

            const qualifiedClick =
              event.button === 1 ||
              (event.button === 0 && (event.metaKey || event.ctrlKey));

            event.preventDefault();

            if (qualifiedClick) {
              window.open(href, "_blank", "noopener,noreferrer");
            }

            return true;
          },
        },
      }),
    ];
  },
});

function buildExtensions() {
  return [
    StarterKit.configure({
      heading: false,
      blockquote: {},
      horizontalRule: {},
      link: false,
    }),
    Superscript,
    Subscript,
    EnhancedLink.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
    }),
    TextAlign.configure({
      types: ["paragraph", "listItem"],
    }),
    TabKeymap,
  ];
}

function normalizeRichTextHtmlForCompare(html: string): string {
  const raw = String(html ?? "").trim();

  if (
    raw === "" ||
    raw === "<p></p>" ||
    raw === "<p><br></p>" ||
    raw === "<p><br /></p>" ||
    raw === "<p>&nbsp;</p>"
  ) {
    return "";
  }

  return raw;
}

function cleanupRichTextHtml(html: string): string {
  if (!html) return "";

  return html.replace(/(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+$/gi, "").trim();
}

export function RichTextContentEditor({
  value,
  disabled = false,
  onChange,
  placeholder,
  hint,
  className,
}: RichTextContentEditorProps) {
  const extensions = useMemo(() => buildExtensions(), []);

  const t = useTranslations();
  const labels = useMemo(
    () => ({
      undo: t("studio.cellEditorTabs.richText.undo"),
      redo: t("studio.cellEditorTabs.richText.redo"),
      list: t("studio.cellEditorTabs.richText.list"),
      bulletList: t("studio.cellEditorTabs.richText.bulletList"),
      orderedList: t("studio.cellEditorTabs.richText.orderedList"),
      quote: t("studio.cellEditorTabs.richText.quote"),
      bold: t("studio.cellEditorTabs.richText.bold"),
      italic: t("studio.cellEditorTabs.richText.italic"),
      underline: t("studio.cellEditorTabs.richText.underline"),
      strike: t("studio.cellEditorTabs.richText.strike"),
      link: t("studio.cellEditorTabs.richText.link"),
      applyLink: t("studio.cellEditorTabs.richText.applyLink"),
      removeLink: t("studio.cellEditorTabs.richText.removeLink"),
      superScript: t("studio.cellEditorTabs.richText.superScript"),
      subScript: t("studio.cellEditorTabs.richText.subScript"),
      alignLeft: t("studio.cellEditorTabs.richText.alignLeft"),
      alignCenter: t("studio.cellEditorTabs.richText.alignCenter"),
      alignRight: t("studio.cellEditorTabs.richText.alignRight"),
      alignJustify: t("studio.cellEditorTabs.richText.alignJustify"),
    }),
    [t],
  );

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");

  const editor = useEditor({
    extensions,
    content: value || "",
    immediatelyRender: false,
    editable: !disabled,
    parseOptions: {
      preserveWhitespace: "full",
    },
    editorProps: {
      attributes: {
        class: editorContentClass(disabled),
      },
    },
    onUpdate: ({ editor }) => {
      const nextHtml = cleanupRichTextHtml(editor.getHTML());
      const currentValue = String(value ?? "");

      if (nextHtml === currentValue) return;

      onChange(nextHtml);
    },
  });

  const [, forceToolbarRender] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const rerender = () => forceToolbarRender((n) => n + 1);

    editor.on("selectionUpdate", rerender);
    editor.on("transaction", rerender);

    return () => {
      editor.off("selectionUpdate", rerender);
      editor.off("transaction", rerender);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const current = cleanupRichTextHtml(editor.getHTML());

    const next = cleanupRichTextHtml(value || "");

    const currentNorm = normalizeRichTextHtmlForCompare(current);
    const nextNorm = normalizeRichTextHtmlForCompare(next);

    if (currentNorm !== nextNorm) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="h-10 w-full rounded-md border bg-muted/40 motion-safe:animate-pulse" />
        <div className="min-h-[180px] w-full rounded-md border bg-muted/40 motion-safe:animate-pulse" />
      </div>
    );
  }

  const marksValue = [
    editor.isActive("bold") ? "bold" : null,
    editor.isActive("italic") ? "italic" : null,
    editor.isActive("underline") ? "underline" : null,
    editor.isActive("strike") ? "strike" : null,
  ].filter(Boolean) as Array<"bold" | "italic" | "underline" | "strike">;

  const scriptValue =
    (editor.isActive("superscript") && "superscript") ||
    (editor.isActive("subscript") && "subscript") ||
    "none";

  const listValue =
    (editor.isActive("bulletList") && "bulletList") ||
    (editor.isActive("orderedList") && "orderedList") ||
    "none";

  const alignValue =
    (editor.isActive({ textAlign: "left" }) && "left") ||
    (editor.isActive({ textAlign: "center" }) && "center") ||
    (editor.isActive({ textAlign: "right" }) && "right") ||
    (editor.isActive({ textAlign: "justify" }) && "justify") ||
    "left";

  const canUndo = editor.can().chain().undo().run();
  const canRedo = editor.can().chain().redo().run();

  const applyList = (next: "none" | "bulletList" | "orderedList") => {
    if (disabled) return;

    if (next === "none") {
      const chain = editor.chain().focus();
      if (editor.isActive("bulletList")) chain.toggleBulletList().run();
      if (editor.isActive("orderedList")) chain.toggleOrderedList().run();
      return;
    }

    const chain = clearBlockConflicts(editor, "list");

    if (next === "bulletList") chain.toggleBulletList().run();
    if (next === "orderedList") chain.toggleOrderedList().run();
  };

  const applyQuote = () => {
    if (disabled) return;

    const chain = clearBlockConflicts(editor, "blockquote");
    chain.toggleBlockquote().run();
  };

  const applyAlign = (next: string) => {
    if (disabled) return;

    const chain = editor.chain().focus();
    if (next === "left") return chain.setTextAlign("left").run();
    if (next === "center") return chain.setTextAlign("center").run();
    if (next === "right") return chain.setTextAlign("right").run();
    if (next === "justify") return chain.setTextAlign("justify").run();
  };

  const applyLink = () => {
    if (disabled) return;

    const href = linkDraft.trim();

    if (!href) {
      editor.chain().focus().unsetLink().run();
      setLinkOpen(false);
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href, target: "_blank", rel: "noopener noreferrer nofollow" })
      .run();

    setLinkOpen(false);
  };

  const removeLink = () => {
    if (disabled) return;

    editor.chain().focus().unsetLink().run();
    setLinkOpen(false);
  };

  const handleEditorKeyDownCapture = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (disabled) return;
    if (event.key !== "Tab") return;

    event.preventDefault();
    event.stopPropagation();

    if (!editor) return;

    if (editor.isActive("listItem")) {
      if (event.shiftKey) {
        editor.chain().focus().liftListItem("listItem").run();
        return;
      }

      editor.chain().focus().sinkListItem("listItem").run();
      return;
    }

    if (event.shiftKey) {
      return;
    }

    editor.chain().focus().insertContent("\u00A0\u00A0\u00A0\u00A0").run();
  };

  const toolbarWrapClass = cn(
    "flex flex-wrap items-center gap-2 bg-card",
    disabled && "opacity-60",
  );

  return (
    <div
      className={cn(
        STUDIO_BORDER_PANEL,
        STACK_MD,
        "shadow-accent h-[70vh] bg-card p-2",
        className,
      )}
    >
      <div className={toolbarWrapClass}>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            visualMode="studio"
            size="icon"
            disabled={disabled || !canUndo}
            onClick={() => editor.chain().focus().undo().run()}
            aria-label={labels.undo}
            title={labels.undo}
            className="scale-110"
          >
            <Undo2 className={toolbarIconClass(disabled || !canUndo)} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            visualMode="studio"
            size="icon"
            disabled={disabled || !canRedo}
            onClick={() => editor.chain().focus().redo().run()}
            aria-label={labels.redo}
            title={labels.redo}
            className="scale-110"
          >
            <Redo2 className={toolbarIconClass(disabled || !canRedo)} />
          </Button>
        </div>

        <Separator orientation="vertical" className="my-1 h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Toggle
              value="lists"
              aria-label={labels.list}
              title={labels.list}
              disabled={disabled}
              onClick={() => editor.chain().focus().run()}
              visualMode="studio"
              className={cn(
                "relative",
                (editor.isActive("bulletList") ||
                  editor.isActive("orderedList")) &&
                  "bg-primary text-primary-foreground",
              )}
            >
              <List className="-ml-1.5" />
              <ChevronDown className="absolute ml-5 h-2 w-2 scale-60 opacity-70" />
            </Toggle>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            visualMode="studio"
            align="start"
            className="w-34"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel visualMode="studio">
                {labels.list}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuRadioGroup
                value={(listValue || "none") as string}
                onValueChange={(next) => {
                  if (disabled) return;
                  applyList(next as "none" | "bulletList" | "orderedList");
                }}
              >
                <DropdownMenuRadioItem
                  visualMode="studio"
                  value="none"
                  disabled={disabled}
                  className="hidden"
                  aria-hidden="true"
                />

                <DropdownMenuRadioItem
                  visualMode="studio"
                  value="bulletList"
                  aria-label={labels.bulletList}
                  title={labels.bulletList}
                  disabled={disabled}
                >
                  <List />
                  <span className="text-xs">{labels.bulletList}</span>
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem
                  visualMode="studio"
                  value="orderedList"
                  aria-label={labels.orderedList}
                  title={labels.orderedList}
                  disabled={disabled}
                >
                  <ListOrdered />
                  <span className="text-xs">{labels.orderedList}</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Toggle
          pressed={editor.isActive("blockquote")}
          value="Blockquote"
          aria-label={labels.quote}
          title={labels.quote}
          disabled={disabled}
          onPressedChange={() => {
            applyQuote();
          }}
          visualMode="studio"
        >
          <TextQuote />
        </Toggle>

        <Separator orientation="vertical" className="my-1 h-6" />

        <ToggleGroup
          visualMode="studio"
          type="multiple"
          value={marksValue}
          spacing={1}
          onValueChange={() => {
            // état dérivé => on déclenche via onClick
          }}
        >
          <ToggleGroupItem
            value="bold"
            visualMode="studio"
            aria-label={labels.bold}
            title={labels.bold}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold />
          </ToggleGroupItem>

          <ToggleGroupItem
            value="italic"
            visualMode="studio"
            aria-label={labels.italic}
            title={labels.italic}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic />
          </ToggleGroupItem>

          <ToggleGroupItem
            value="underline"
            visualMode="studio"
            aria-label={labels.underline}
            title={labels.underline}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon />
          </ToggleGroupItem>

          <ToggleGroupItem
            value="strike"
            visualMode="studio"
            aria-label={labels.strike}
            title={labels.strike}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough />
          </ToggleGroupItem>

          <Popover
            open={linkOpen}
            onOpenChange={(next) => {
              setLinkOpen(next);

              if (!next) return;

              const existing = editor.getAttributes("link")?.href;
              setLinkDraft(typeof existing === "string" ? existing : "");
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                visualMode="studio"
                size="icon"
                aria-label={labels.link}
                title={labels.link}
                disabled={disabled}
                className={cn(
                  editor.isActive("link") &&
                    "bg-primary text-primary-foreground",
                  "scale-110",
                  "active:scale-[1]!",
                )}
              >
                <Link2 />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              sideOffset={6}
              className="w-[360px] rounded-lg p-2"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-2">
                <InputGroup
                  visualMode="studio"
                  className="flex-1 [--radius:9999px]"
                >
                  <InputGroupInput
                    visualMode="studio"
                    placeholder="https://…"
                    disabled={disabled}
                    value={linkDraft}
                    onChange={(e) => setLinkDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyLink();
                      if (e.key === "Escape") setLinkOpen(false);
                    }}
                    autoFocus
                  />
                </InputGroup>

                <Button
                  size="icon"
                  variant="ghost"
                  visualMode="studio"
                  aria-label={labels.applyLink}
                  title={labels.applyLink}
                  disabled={disabled}
                  onClick={applyLink}
                  className="scale-110"
                >
                  <Check />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  visualMode="studio"
                  aria-label={labels.removeLink}
                  title={labels.removeLink}
                  disabled={disabled || !editor.isActive("link")}
                  onClick={removeLink}
                  className="scale-110"
                >
                  <Trash2 />
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </ToggleGroup>

        <Separator orientation="vertical" className="my-1 h-6" />

        <ToggleGroup
          type="single"
          visualMode="studio"
          value={scriptValue}
          spacing={1}
          onValueChange={() => {
            // état dérivé => on déclenche via onClick
          }}
        >
          <ToggleGroupItem
            value="none"
            visualMode="studio"
            className="hidden"
            aria-hidden="true"
          />

          <ToggleGroupItem
            value="superscript"
            visualMode="studio"
            aria-label={labels.superScript}
            title={labels.superScript}
            disabled={disabled}
            onClick={() => {
              if (editor.isActive("subscript")) {
                editor.chain().focus().toggleSubscript().run();
              }
              editor.chain().focus().toggleSuperscript().run();
            }}
          >
            <span className="-mr-1 text-base font-semibold">x²</span>
          </ToggleGroupItem>

          <ToggleGroupItem
            value="subscript"
            visualMode="studio"
            aria-label={labels.subScript}
            title={labels.subScript}
            disabled={disabled}
            onClick={() => {
              if (editor.isActive("superscript")) {
                editor.chain().focus().toggleSuperscript().run();
              }
              editor.chain().focus().toggleSubscript().run();
            }}
          >
            <span className="-mr-1 -mt-1 text-base font-semibold">x₂</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="my-1 h-6" />

        <ToggleGroup
          type="single"
          visualMode="studio"
          value={alignValue}
          spacing={1}
          onValueChange={(next) => {
            if (!next) return;
            applyAlign(next);
          }}
        >
          <ToggleGroupItem
            value="left"
            visualMode="studio"
            aria-label={labels.alignLeft}
            title={labels.alignLeft}
            disabled={disabled}
          >
            <AlignLeft />
          </ToggleGroupItem>

          <ToggleGroupItem
            value="center"
            visualMode="studio"
            aria-label={labels.alignCenter}
            title={labels.alignCenter}
            disabled={disabled}
          >
            <AlignCenter />
          </ToggleGroupItem>

          <ToggleGroupItem
            value="right"
            visualMode="studio"
            aria-label={labels.alignRight}
            title={labels.alignRight}
            disabled={disabled}
          >
            <AlignRight />
          </ToggleGroupItem>

          <ToggleGroupItem
            value="justify"
            visualMode="studio"
            aria-label={labels.alignJustify}
            title={labels.alignJustify}
            disabled={disabled}
          >
            <AlignJustify />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {placeholder ? (
        <div className="sr-only" aria-hidden="true">
          {placeholder}
        </div>
      ) : null}

      <div onKeyDownCapture={handleEditorKeyDownCapture}>
        <EditorContent editor={editor} />
      </div>

      {hint ? (
        <Text as="p" variant="meta">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}

RichTextContentEditor.displayName = "RichTextContentEditor";

function clearBlockConflicts(editor: Editor, next: BlockKind) {
  const chain = editor.chain().focus();

  if (next === "blockquote") {
    if (editor.isActive("bulletList")) chain.toggleBulletList();
    if (editor.isActive("orderedList")) chain.toggleOrderedList();
    return chain;
  }

  if (next === "list") {
    if (editor.isActive("blockquote")) chain.toggleBlockquote();
    return chain;
  }

  return chain;
}

function toolbarIconClass(disabled?: boolean) {
  return cn(disabled && "opacity-70");
}

function editorContentClass(disabled?: boolean) {
  return cn(
    "min-h-[180px] w-full bg-card p-3 text-sm",
    "focus:outline-none",
    disabled && "opacity-60",
    PROSE_CLASSNAME,
  );
}
