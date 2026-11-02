import type { QueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { HuntSpot } from "@/types/application/cosmetic-events/hunt-spot";
import type { SaciHunt } from "@/types/application/cosmetic-events/saci-hunt";
import type { LojaItem } from "@/types/application/loja/loja-item";
import type { LojaLook } from "@/types/application/loja/loja-look";
import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";
import type { Profile } from "@/types/application/profile/profile";
import { OFFICIAL_BADGE_ICONS, type ProfileCardData } from "@rede-enois/design-system/domain";

import { walletQueries } from "@/lib/query-options/wallet";

import { ApiError } from "./api-client";
import { authorNameStyle } from "./profile-name-style";

/** Free status icons anyone can pick; the others come from owned official badges. */
export const FREE_STATUS_ICONS = ["cafe", "estrela", "coracao", "chip"] as const;
export const MAX_STATUS_CHARS = 60;
/** Collections that show the Saci × Halloween duel under their heading in the shop. */
export const DUEL_COLLECTIONS: ReadonlySet<string> = new Set(["saci", "halloween"]);

const MF_PER_FAISCA = 1_000;

/**
 * What a look costs now: 75% of the pieces the user does not own yet, rounded to whole faíscas.
 * Same arithmetic as the backend (`round(sum * 3 / 4000) * 1000`), so the label is the charge.
 */
export function lookPriceMf(
  look: Pick<LojaLook, "items">,
  itemsById: ReadonlyMap<string, Pick<LojaItem, "priceMf" | "owned">>,
): number {
  const missingMf = look.items.reduce((sum, id): number => {
    const item = itemsById.get(id);
    return item && !item.owned ? sum + item.priceMf : sum;
  }, 0);
  return Math.round((missingMf * 3) / (4 * MF_PER_FAISCA)) * MF_PER_FAISCA;
}

/**
 * Whether equipping these items changes the name style. The owner's local name preference wins
 * over the server on their profile, so the shop clears it when the server style changes.
 */
export function changesNameStyle(
  ids: readonly string[],
  itemsById: ReadonlyMap<string, Pick<LojaItem, "kind">>,
): boolean {
  return ids.some((id): boolean => itemsById.get(id)?.kind === "NAME_STYLE");
}

/** pt-BR message for a failed shop, status or event call: one per known code, else generic. */
export function cosmeticErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code && texts.cosmetics.errors[error.code]) {
    return texts.cosmetics.errors[error.code];
  }
  return texts.cosmetics.genericError;
}

/** The hidden Saci shows only during the hunt, for a signed-in person, until that spot is found. */
export function huntSpotVisible(
  hunt: Pick<SaciHunt, "active" | "found"> | undefined,
  spot: HuntSpot,
  authenticated: boolean,
): boolean {
  return Boolean(authenticated && hunt?.active && !hunt.found.includes(spot));
}

/** Status icons the user may pick: the free ones, then the icon of each owned official badge. */
export function statusIconChoices(
  items: readonly Pick<LojaItem, "id" | "kind" | "name" | "owned">[] | undefined,
): { icon: string; label: string }[] {
  const choices = FREE_STATUS_ICONS.map((icon): { icon: string; label: string } => ({
    icon,
    label: texts.cosmetics.status.freeIcons[icon],
  }));
  const seen = new Set<string>(FREE_STATUS_ICONS);
  for (const item of items ?? []) {
    if (item.kind !== "BADGE" || !item.owned || !Object.hasOwn(OFFICIAL_BADGE_ICONS, item.id)) {
      continue;
    }
    const icon = OFFICIAL_BADGE_ICONS[item.id];
    if (seen.has(icon)) continue;
    seen.add(icon);
    choices.push({ icon, label: item.name });
  }
  return choices;
}

/** A profile as the design system cards draw it; `nameStyle` overrides the saved style. */
export function profileCardData(
  profile: Profile,
  nameStyle: AuthorNameStyle | null = authorNameStyle(profile),
): ProfileCardData {
  return {
    name: profile.name,
    username: profile.username,
    pronouns: profile.pronouns,
    avatar: profile.avatar,
    avatarFrame: profile.avatarFrame,
    nameStyle,
    badges: profile.badges,
    badge: profile.badge,
    bio: profile.bio,
    banner: profile.banner,
    bannerItem: profile.bannerItem,
    cardTheme: profile.cardTheme,
    nameplate: profile.nameplate,
    profileEffect: profile.profileEffect,
    statusText: profile.statusText,
    statusIcon: profile.statusIcon,
  };
}

/** Everything a purchase, equip or event reward can change on screen. */
export function invalidateCosmetics(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: walletQueries.wallet().queryKey });
  for (const key of ["loja", "profile", "me", "feed"]) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }
}
