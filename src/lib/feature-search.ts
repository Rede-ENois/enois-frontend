import { texts } from "@/texts";
import type { GlobalSearchResultData, InterfaceContext } from "@rede-enois/design-system/domain";
import { Bell, LifeBuoy, UserCog, Wallet } from "lucide-react";

import { exploreItems } from "@/components/explore-items";
import { navigationItemsFor } from "@/components/navigation-items";

/** Lowercase without accents, so "noticias" finds "Notícias". */
function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const ACCOUNT = [
  { href: "/carteira", text: texts.featureSearch.wallet, icon: Wallet },
  { href: "/conta", text: texts.featureSearch.account, icon: UserCog },
  { href: "/suporte", text: texts.featureSearch.support, icon: LifeBuoy },
  {
    href: "/notificacoes/preferencias",
    text: texts.featureSearch.notificationPreferences,
    icon: Bell,
  },
];

/**
 * The app's own places that match a search: Explore rooms, menu entries of the active interface
 * and the account pages, skipping modules the person turned off. Shown above people and posts.
 */
export function matchFeatures(
  query: string,
  context: InterfaceContext,
  disabledModules: ReadonlySet<string>,
): GlobalSearchResultData[] {
  const needle = fold(query.trim());
  if (needle.length < 2) return [];

  const candidates = [
    ...exploreItems
      .filter((item) => !item.module || !disabledModules.has(item.module))
      .map((item) => ({
        href: item.href,
        title: item.text.label,
        subtitle: item.text.description,
        icon: item.icon,
        color: item.color,
        keywords: item.keywords ?? [],
      })),
    ...navigationItemsFor(context)
      .filter((item) => !item.module || !disabledModules.has(item.module))
      .map((item) => ({
        href: item.to,
        title: item.label,
        subtitle: texts.featureSearch.menuSubtitle,
        icon: item.icon,
        color: undefined,
        keywords: [] as string[],
      })),
    ...ACCOUNT.map((item) => ({
      href: item.href,
      title: item.text.label,
      subtitle: item.text.description,
      icon: item.icon,
      color: undefined,
      keywords: [] as string[],
    })),
  ];

  const seen = new Set<string>();
  return candidates
    .filter((item) =>
      [item.title, item.subtitle, ...item.keywords].some((field) => fold(field).includes(needle)),
    )
    .filter((item) => !seen.has(item.href) && Boolean(seen.add(item.href)))
    .slice(0, 4)
    .map(({ keywords: _keywords, ...item }) => ({
      ...item,
      id: item.href,
      type: "feature",
      image: null,
    }));
}
