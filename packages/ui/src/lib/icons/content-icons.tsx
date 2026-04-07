/**
 * @file packages/ui/src/lib/icons/content-icons.tsx
 * @layer ui/lib/icons
 * @description
 * Source de vérité UI pour les icônes de contenu génériques.
 */

import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeAlert,
  BadgeCheck,
  BarChart3,
  Bell,
  Blocks,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  CircleGauge,
  ClipboardList,
  Clock,
  Cloud,
  Code2,
  Component,
  CreditCard,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Hammer,
  Handshake,
  Heart,
  HelpCircle,
  ImageIcon,
  Layers,
  Layout,
  Lightbulb,
  Lock,
  Mail,
  MapPinned,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Monitor,
  Newspaper,
  Palette,
  PenTool,
  Phone,
  Puzzle,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

export const CONTENT_ICON_DEFS: ReadonlyArray<{
  value: ContentIconKind;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "activity", label: "Activité", icon: Activity },
  { value: "badge-alert", label: "Alerte", icon: BadgeAlert },
  { value: "badge-check", label: "Validation", icon: BadgeCheck },
  { value: "bar-chart-3", label: "Graphique", icon: BarChart3 },
  { value: "bell", label: "Notification", icon: Bell },
  { value: "blocks", label: "Blocs", icon: Blocks },
  { value: "book-open", label: "Documentation", icon: BookOpen },
  { value: "briefcase-business", label: "Business", icon: BriefcaseBusiness },
  { value: "building-2", label: "Entreprise", icon: Building2 },
  { value: "calendar", label: "Calendrier", icon: Calendar },
  { value: "camera", label: "Photo", icon: Camera },
  { value: "check-circle-2", label: "Succès", icon: CheckCircle2 },
  { value: "circle-dollar-sign", label: "Finance", icon: CircleDollarSign },
  { value: "circle-gauge", label: "Performance", icon: CircleGauge },
  { value: "clipboard-list", label: "Checklist", icon: ClipboardList },
  { value: "clock", label: "Temps", icon: Clock },
  { value: "cloud", label: "Cloud", icon: Cloud },
  { value: "code-2", label: "Code", icon: Code2 },
  { value: "component", label: "Composant", icon: Component },
  { value: "credit-card", label: "Paiement", icon: CreditCard },
  { value: "file-text", label: "Texte", icon: FileText },
  { value: "folder-open", label: "Dossier", icon: FolderOpen },
  { value: "globe", label: "Web", icon: Globe },
  { value: "graduation-cap", label: "Formation", icon: GraduationCap },
  { value: "hammer", label: "Construction", icon: Hammer },
  { value: "handshake", label: "Collaboration", icon: Handshake },
  { value: "heart", label: "Favori", icon: Heart },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "layout", label: "Structure", icon: Layout },
  { value: "layers", label: "Cohérence", icon: Layers },
  { value: "lightbulb", label: "Idée", icon: Lightbulb },
  { value: "lock", label: "Sécurité", icon: Lock },
  { value: "mail", label: "Email", icon: Mail },
  { value: "map-pinned", label: "Localisation", icon: MapPinned },
  { value: "megaphone", label: "Annonce", icon: Megaphone },
  { value: "menu", label: "Navigation", icon: Menu },
  { value: "message-circle", label: "Discussion", icon: MessageCircle },
  { value: "message-square", label: "Message", icon: MessageSquare },
  { value: "monitor", label: "Écran", icon: Monitor },
  { value: "newspaper", label: "Actualité", icon: Newspaper },
  { value: "palette", label: "Design", icon: Palette },
  { value: "pen-tool", label: "Création", icon: PenTool },
  { value: "phone", label: "Téléphone", icon: Phone },
  { value: "puzzle", label: "Modulaire", icon: Puzzle },
  { value: "rocket", label: "Lancement", icon: Rocket },
  { value: "search", label: "Recherche", icon: Search },
  { value: "settings", label: "Réglages", icon: Settings },
  { value: "shield-check", label: "Fiabilité", icon: ShieldCheck },
  { value: "shopping-bag", label: "Commerce", icon: ShoppingBag },
  { value: "sparkles", label: "Mise en avant", icon: Sparkles },
  { value: "star", label: "Qualité", icon: Star },
  { value: "store", label: "Boutique", icon: Store },
  { value: "target", label: "Objectif", icon: Target },
  { value: "trending-up", label: "Évolution", icon: TrendingUp },
  { value: "users", label: "Utilisateurs", icon: Users },
  { value: "wallet", label: "Budget", icon: Wallet },
  { value: "wrench", label: "Outil", icon: Wrench },
  { value: "zap", label: "Rapidité", icon: Zap },
] as const;

export type ContentIconRenderProps = Readonly<{
  className?: string;
}>;

export type ContentIconOption = Readonly<{
  value: ContentIconKind;
  label: string;
}>;

const DEFAULT_ICON_CLASS = "h-5 w-5 flex-none";

const CONTENT_ICON_MAP = new Map<string, LucideIcon>(
  CONTENT_ICON_DEFS.map((item) => [item.value, item.icon]),
);

const CONTENT_ICON_LABEL_MAP = new Map<string, string>(
  CONTENT_ICON_DEFS.map((item) => [item.value, item.label]),
);

export function normalizeContentIconKind(kind: string): string {
  return String(kind ?? "")
    .trim()
    .toLowerCase();
}

export function isContentIconKind(value: string): value is ContentIconKind {
  return CONTENT_ICON_MAP.has(value);
}

export function buildContentIconOptions(): ReadonlyArray<ContentIconOption> {
  return CONTENT_ICON_DEFS.map(({ value, label }) => ({ value, label }));
}

export function filterContentIconOptions(
  query: string,
): ReadonlyArray<ContentIconOption> {
  const q = normalizeContentIconKind(query);

  if (!q) {
    return buildContentIconOptions();
  }

  return CONTENT_ICON_DEFS.filter((item) => {
    return (
      item.value.includes(q) ||
      item.label.toLowerCase().includes(q) ||
      item.value.replace(/-/g, " ").includes(q)
    );
  }).map(({ value, label }) => ({ value, label }));
}

export function getContentIconLabel(kind: string): string {
  const normalizedKind = normalizeContentIconKind(kind);
  return CONTENT_ICON_LABEL_MAP.get(normalizedKind) ?? "Icône";
}

export function renderContentIcon(
  kind: string,
  props: ContentIconRenderProps = {},
): ReactNode {
  const normalizedKind = normalizeContentIconKind(kind);
  const className = props.className ?? DEFAULT_ICON_CLASS;

  const Icon = CONTENT_ICON_MAP.get(normalizedKind) ?? HelpCircle;
  return <Icon className={className} aria-hidden />;
}
