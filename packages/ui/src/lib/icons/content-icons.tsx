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
  AlertTriangle,
  ArrowDownFromLine,
  ArrowRightLeft,
  BadgeAlert,
  BadgeCheck,
  BarChart3,
  Bell,
  Blocks,
  BookOpen,
  Bot,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Camera,
  ChartPie,
  CheckCheck,
  CheckCircle2,
  CircleDollarSign,
  CircleGauge,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Cloud,
  Code2,
  Cog,
  Columns3,
  Component,
  Cpu,
  CreditCard,
  Database,
  Disc,
  Disc3,
  Eye,
  EyeOff,
  Factory,
  FileCheck,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  FolderTree,
  GitBranch,
  Globe,
  GraduationCap,
  Hammer,
  HandCoins,
  Handshake,
  Headset,
  Heart,
  HelpCircle,
  History,
  ImageIcon,
  Layers,
  Layout,
  LayoutDashboard,
  Lightbulb,
  List,
  ListChecks,
  Lock,
  Logs,
  Mail,
  MapPinned,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Monitor,
  Network,
  Newspaper,
  PackageOpen,
  Palette,
  PenTool,
  Phone,
  Puzzle,
  Receipt,
  RefreshCw,
  Repeat,
  Rocket,
  Route,
  Rows3,
  ScanSearch,
  Search,
  Send,
  Settings,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Shuffle,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Speech,
  Star,
  Store,
  Table,
  Target,
  Timer,
  TimerReset,
  TrendingUp,
  UserRound,
  UserRoundCog,
  Users,
  UsersRound,
  Wallet,
  Waypoints,
  Workflow,
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
  { value: "alert-triangle", label: "Alerte critique", icon: AlertTriangle },
  {
    value: "arrow-down-from-line",
    label: "Suspension",
    icon: ArrowDownFromLine,
  },
  { value: "arrow-right-left", label: "Échange", icon: ArrowRightLeft },
  { value: "badge-alert", label: "Alerte", icon: BadgeAlert },
  { value: "badge-check", label: "Validation", icon: BadgeCheck },
  { value: "bar-chart-3", label: "Graphique", icon: BarChart3 },
  { value: "bell", label: "Notification", icon: Bell },
  { value: "blocks", label: "Blocs", icon: Blocks },
  { value: "book-open", label: "Documentation", icon: BookOpen },
  { value: "bot", label: "Automatisation", icon: Bot },
  { value: "briefcase", label: "Service", icon: Briefcase },
  { value: "briefcase-business", label: "Business", icon: BriefcaseBusiness },
  { value: "building-2", label: "Entreprise", icon: Building2 },
  { value: "calendar", label: "Calendrier", icon: Calendar },
  { value: "camera", label: "Photo", icon: Camera },
  { value: "chart-pie", label: "Répartition", icon: ChartPie },
  { value: "check-check", label: "Contrôle", icon: CheckCheck },
  { value: "check-circle-2", label: "Succès", icon: CheckCircle2 },
  { value: "circle-dollar-sign", label: "Finance", icon: CircleDollarSign },
  { value: "circle-gauge", label: "Performance", icon: CircleGauge },
  { value: "clipboard-check", label: "Conformité", icon: ClipboardCheck },
  { value: "clipboard-list", label: "Checklist", icon: ClipboardList },
  { value: "clock", label: "Temps", icon: Clock },
  { value: "cloud", label: "Cloud", icon: Cloud },
  { value: "code-2", label: "Code", icon: Code2 },
  { value: "cog", label: "Mécanique", icon: Cog },
  { value: "columns-3", label: "Colonnes", icon: Columns3 },
  { value: "component", label: "Composant", icon: Component },
  { value: "cpu", label: "Système", icon: Cpu },
  { value: "credit-card", label: "Paiement", icon: CreditCard },
  { value: "database", label: "Base de données", icon: Database },
  { value: "disc", label: "Disque", icon: Disc },
  { value: "disc-3", label: "Rotation", icon: Disc3 },
  { value: "eye", label: "Visibilité", icon: Eye },
  { value: "eye-off", label: "Manque de visibilité", icon: EyeOff },
  { value: "factory", label: "Production", icon: Factory },
  { value: "file-check", label: "Document validé", icon: FileCheck },
  { value: "file-search", label: "Audit", icon: FileSearch },
  { value: "file-spreadsheet", label: "Tableur", icon: FileSpreadsheet },
  { value: "file-text", label: "Texte", icon: FileText },
  { value: "filter", label: "Filtre", icon: Filter },
  { value: "folder-open", label: "Dossier", icon: FolderOpen },
  { value: "folder-tree", label: "Arborescence", icon: FolderTree },
  { value: "git-branch", label: "Branche", icon: GitBranch },
  { value: "globe", label: "Web", icon: Globe },
  { value: "graduation-cap", label: "Formation", icon: GraduationCap },
  { value: "hammer", label: "Construction", icon: Hammer },
  { value: "hand-coins", label: "Rentabilité", icon: HandCoins },
  { value: "handshake", label: "Collaboration", icon: Handshake },
  { value: "headset", label: "Support", icon: Headset },
  { value: "heart", label: "Favori", icon: Heart },
  { value: "history", label: "Historique", icon: History },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "layout", label: "Structure", icon: Layout },
  { value: "layout-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "layers", label: "Cohérence", icon: Layers },
  { value: "lightbulb", label: "Idée", icon: Lightbulb },
  { value: "list", label: "Liste", icon: List },
  { value: "list-checks", label: "Étapes", icon: ListChecks },
  { value: "lock", label: "Sécurité", icon: Lock },
  { value: "logs", label: "Journal", icon: Logs },
  { value: "mail", label: "Email", icon: Mail },
  { value: "map-pinned", label: "Localisation", icon: MapPinned },
  { value: "megaphone", label: "Annonce", icon: Megaphone },
  { value: "menu", label: "Navigation", icon: Menu },
  { value: "message-circle", label: "Discussion", icon: MessageCircle },
  { value: "message-square", label: "Message", icon: MessageSquare },
  { value: "monitor", label: "Écran", icon: Monitor },
  { value: "network", label: "Réseau", icon: Network },
  { value: "newspaper", label: "Actualité", icon: Newspaper },
  { value: "package-open", label: "Livrable", icon: PackageOpen },
  { value: "palette", label: "Design", icon: Palette },
  { value: "pen-tool", label: "Création", icon: PenTool },
  { value: "phone", label: "Téléphone", icon: Phone },
  { value: "puzzle", label: "Modulaire", icon: Puzzle },
  { value: "receipt", label: "Facturation", icon: Receipt },
  { value: "refresh-cw", label: "Synchronisation", icon: RefreshCw },
  { value: "repeat", label: "Répétition", icon: Repeat },
  { value: "rocket", label: "Lancement", icon: Rocket },
  { value: "route", label: "Parcours", icon: Route },
  { value: "rows-3", label: "Lignes", icon: Rows3 },
  { value: "scan-search", label: "Analyse", icon: ScanSearch },
  { value: "search", label: "Recherche", icon: Search },
  { value: "send", label: "Envoi", icon: Send },
  { value: "settings", label: "Réglages", icon: Settings },
  { value: "settings-2", label: "Configuration", icon: Settings2 },
  { value: "shield-alert", label: "Risque", icon: ShieldAlert },
  { value: "shield-check", label: "Fiabilité", icon: ShieldCheck },
  { value: "shopping-bag", label: "Commerce", icon: ShoppingBag },
  { value: "shuffle", label: "Flux", icon: Shuffle },
  { value: "siren", label: "Urgence", icon: Siren },
  { value: "sliders-horizontal", label: "Ajustement", icon: SlidersHorizontal },
  { value: "sparkles", label: "Mise en avant", icon: Sparkles },
  { value: "speech", label: "Prise de parole", icon: Speech },
  { value: "star", label: "Qualité", icon: Star },
  { value: "store", label: "Boutique", icon: Store },
  { value: "table", label: "Tableau", icon: Table },
  { value: "target", label: "Objectif", icon: Target },
  { value: "timer", label: "Minuteur", icon: Timer },
  { value: "timer-reset", label: "Relance", icon: TimerReset },
  { value: "trending-up", label: "Évolution", icon: TrendingUp },
  { value: "user-round", label: "Utilisateur", icon: UserRound },
  { value: "user-round-cog", label: "Dépendance humaine", icon: UserRoundCog },
  { value: "users", label: "Utilisateurs", icon: Users },
  { value: "users-round", label: "Équipe", icon: UsersRound },
  { value: "wallet", label: "Budget", icon: Wallet },
  { value: "waypoints", label: "Workflow", icon: Waypoints },
  { value: "workflow", label: "Processus", icon: Workflow },
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

function compareContentIconOptions(
  a: ContentIconOption,
  b: ContentIconOption,
): number {
  return a.label.localeCompare(b.label, "fr", {
    sensitivity: "base",
    numeric: true,
  });
}

export function normalizeContentIconKind(kind: string): string {
  return String(kind ?? "")
    .trim()
    .toLowerCase();
}

export function isContentIconKind(value: string): value is ContentIconKind {
  return CONTENT_ICON_MAP.has(value);
}

export function buildContentIconOptions(): ReadonlyArray<ContentIconOption> {
  return CONTENT_ICON_DEFS.map(({ value, label }) => ({ value, label })).sort(
    compareContentIconOptions,
  );
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
  })
    .map(({ value, label }) => ({ value, label }))
    .sort(compareContentIconOptions);
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
