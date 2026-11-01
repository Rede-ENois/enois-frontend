import { type CSSProperties, useId, useMemo, useState } from "react";

import { texts } from "@/texts";
import { cn, useMessages } from "@rede-enois/design-system";
import {
  COSMETIC_KINDS,
  CosmeticItemArt,
  type CosmeticKind,
  type CosmeticShopCollection,
  type CosmeticShopItem,
  type CosmeticShopLook,
  type CosmeticShopProps,
  type CosmeticTryOn,
  EMPTY_TRY_ON,
  Nameplate,
  ProfileCard,
  StyledName,
  type StyledNameProps,
  UserAvatar,
  UserBadges,
  albumPage,
  cardTheme,
  completedCollections,
  countByKind,
  isTryingOn,
  lookMissing,
  previewProfile,
  toggleTryItem,
  tryLook,
} from "@rede-enois/design-system/domain";
import { Button, LoadingState } from "@rede-enois/design-system/ui";
import { ChevronDown, RotateCcw, Search, Sparkles, X } from "lucide-react";

const PAGE_SIZE = 24;

/**
 * Sentinel for the "every collection" tab. The design system's shop only knows a single
 * collection per tab (`item.collection === collection`), so the catalog-wide view lives here
 * until that tab ships in the package.
 */
const EVERYTHING = "*";

/**
 * The collection tabs in shop order: what can be bought today comes first (collections in
 * season, then the year-round classics, `null`), and out-of-season collections close the row.
 * Same order as the design system's newer releases, which the published package does not
 * export yet.
 */
function shopTabs(
  collections: readonly CosmeticShopCollection[],
  hasClassics: boolean,
): (CosmeticShopCollection | null)[] {
  return [
    ...collections.filter((c): boolean => c.available),
    ...(hasClassics ? [null] : []),
    ...collections.filter((c): boolean => !c.available),
  ];
}

/** What the view lists: with a search text every collection, else the picked tab. */
function shopPool(
  items: readonly CosmeticShopItem[],
  collections: readonly CosmeticShopCollection[],
  { collection, query }: { collection: string | null; query: string },
): CosmeticShopItem[] {
  const text = query.trim().toLocaleLowerCase("pt-BR");
  if (!text) {
    if (collection === EVERYTHING) return [...items];
    return items.filter((item): boolean => item.collection === collection);
  }
  const names = new Map(collections.map((c): [string, string] => [c.id, c.name]));
  return items.filter((item): boolean =>
    `${item.name} ${item.description} ${(item.collection && names.get(item.collection)) ?? ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(text),
  );
}

/**
 * The cosmetics shop: ready looks, collection tabs, kind chips, search, item cards that try
 * the item on a live profile card, and the album of each collection. Opens on EVERY collection
 * (the whole catalog) — a single seasonal tab hid the rest of the year's items. Out-of-season
 * items stay listed but cannot be bought. Shop pictures only move on hover, focus or while
 * tried on.
 */
export function CosmeticCatalog({
  items,
  collections = [],
  user,
  loading = false,
  error = false,
  onRetry,
  actionPending = false,
  onBuy,
  onBuyLook,
  onEquip,
  onUnequip,
  renderCollectionExtra,
  initialCollection,
}: CosmeticShopProps) {
  const messages = useMessages().cosmeticShop;
  const [picked, setPicked] = useState<string | null | undefined>(initialCollection);
  const [kind, setKind] = useState<CosmeticKind | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [tryOn, setTryOn] = useState<CosmeticTryOn>(EMPTY_TRY_ON);
  const [replay, setReplay] = useState(0);
  const headingId = useId();

  const catalog = useMemo(() => items ?? [], [items]);
  const itemsById = useMemo(
    () => new Map(catalog.map((item): [string, CosmeticShopItem] => [item.id, item])),
    [catalog],
  );

  if (loading) return <LoadingState />;
  if (error || !items) {
    return (
      <div className="frame-shop-error" role="alert">
        <p>{messages.loadError}</p>

        <Button variant="outline" onClick={onRetry}>
          {messages.retry}
        </Button>
      </div>
    );
  }

  const collection = picked === undefined ? EVERYTHING : picked;
  const searching = query.trim() !== "";
  const hasClassics = catalog.some((item) => item.collection === null);
  const pool = shopPool(catalog, collections, { collection, query });
  const counts = countByKind(pool);
  const listed = kind === "ALL" ? pool : pool.filter((item) => item.kind === kind);
  const current = collections.find((c) => c.id === collection);
  const preview = previewProfile(user, tryOn);
  const tryingNames = Object.values(tryOn.items)
    .map((id) => itemsById.get(id)?.name)
    .filter(Boolean)
    .join(", ");
  const lookTried = collections.flatMap((c) => c.looks).find((look) => look.id === tryOn.look);

  const resetPage = () => setVisible(PAGE_SIZE);
  const tryItem = (item: CosmeticShopItem) => {
    setTryOn((state) => toggleTryItem(state, item));
    if (item.kind === "PROFILE_EFFECT") setReplay((n) => n + 1);
  };
  const wearLook = (look: CosmeticShopLook) => {
    setTryOn(tryLook(look, itemsById));
    setReplay((n) => n + 1);
  };

  const action = (item: CosmeticShopItem) => {
    if (item.owned) {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={actionPending}
          onClick={() => (item.equipped ? onUnequip(item.id) : onEquip(item.id))}
        >
          {item.equipped ? messages.unequip : messages.equip}
        </Button>
      );
    }
    if (!item.purchasable) return <span className="cos-shop__note">{messages.reward}</span>;
    if (!item.available) return <span className="cos-shop__note">{messages.outOfSeason}</span>;
    return (
      <Button size="sm" disabled={actionPending} onClick={() => onBuy(item.id)}>
        {messages.buy}
      </Button>
    );
  };

  const look = (entry: CosmeticShopLook, available: boolean, collectionName: string) => {
    const missing = lookMissing(entry, itemsById);
    const themeId = entry.items.find((id) => itemsById.get(id)?.kind === "CARD_THEME");
    const theme = cardTheme(themeId);
    const ofKind = (k: CosmeticKind) => entry.items.find((id) => itemsById.get(id)?.kind === k);
    const nameTheme = ofKind("NAME_STYLE");
    const on = tryOn.look === entry.id;
    return (
      <li
        key={entry.id}
        className={cn("cos-look", on ? "is-on" : "cos-still")}
        style={
          theme
            ? ({ "--lt": theme.top, "--lb": theme.bottom, color: theme.fg } as CSSProperties)
            : undefined
        }
      >
        <button
          type="button"
          className="cos-look__stage"
          aria-pressed={on}
          aria-label={messages.wearLook(entry.title)}
          onClick={() => wearLook(entry)}
        >
          <UserAvatar
            src={user.avatar}
            alt={user.name}
            frame={ofKind("FRAME")}
            className="cos-look__avatar"
          />

          <span className="cos-look__name">
            <StyledName
              name={entry.title}
              style={nameTheme ? ({ theme: nameTheme } as StyledNameProps["style"]) : null}
            />
          </span>

          <span className="cos-look__badges">
            <UserBadges badges={entry.items.filter((id) => itemsById.get(id)?.kind === "BADGE")} />
          </span>
        </button>

        <div className="cos-look__foot">
          <span>{collectionName}</span>
          {missing.length === 0 ? (
            <span className="cos-shop__owned">{messages.lookOwned}</span>
          ) : available ? (
            <Button
              size="sm"
              disabled={actionPending}
              title={messages.lookDiscount(missing.length)}
              onClick={() => onBuyLook(entry.id)}
            >
              <Sparkles aria-hidden />
              {entry.priceLabel}
            </Button>
          ) : (
            <span className="cos-shop__note">{messages.outOfSeason}</span>
          )}
        </div>
      </li>
    );
  };

  const card = (item: CosmeticShopItem) => {
    const trying = tryOn.items[item.kind] === item.id;
    return (
      <li key={item.id} className={cn("cos-item", trying ? "is-trying" : "cos-still")}>
        <button
          type="button"
          className="cos-item__stage"
          aria-pressed={trying}
          aria-label={messages.tryItem(item.name)}
          onClick={() => tryItem(item)}
        >
          <span className="cos-item__kind">{messages.kind[item.kind]}</span>
          {item.owned ? (
            <span className="cos-item__tag is-owned">
              {item.equipped ? messages.equipped : messages.owned}
            </span>
          ) : (
            !item.available &&
            item.purchasable && <span className="cos-item__tag">{messages.outOfSeason}</span>
          )}
          <CosmeticItemArt item={item} user={user} variant="stage" />
        </button>

        <div className="cos-item__body">
          <h3>{item.name}</h3>

          <p>{item.description}</p>

          <div className="cos-item__foot">
            {item.purchasable ? (
              <span className="cos-shop__price">
                <Sparkles size={13} aria-hidden />
                {item.priceLabel}
                <span className="sr-only"> {messages.sparks}</span>
              </span>
            ) : (
              <span />
            )}
            {action(item)}
          </div>
        </div>
      </li>
    );
  };

  const album = current ? albumPage(catalog, current.id) : null;
  const done = completedCollections(catalog, collections);

  return (
    <div className="cos-shop">
      {collections.some((c) => c.looks.length > 0) && (
        <section className="cos-shop__looks" aria-labelledby={`${headingId}-looks`}>
          <header className="cos-shop__head">
            <h2 id={`${headingId}-looks`}>{messages.looksTitle}</h2>

            <p>{messages.looksDescription}</p>
          </header>

          <ul className="cos-shop__look-grid">
            {collections.flatMap((c) => c.looks.map((entry) => look(entry, c.available, c.name)))}
          </ul>
        </section>
      )}

      <div className="cos-shop__main">
        <div className="cos-shop__catalog">
          <div className="cos-shop__toolbar">
            <label className="cos-shop__search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                aria-label={messages.searchLabel}
                placeholder={messages.search}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  resetPage();
                }}
              />
            </label>

            <div className="cos-shop__chips" role="group" aria-label={messages.collectionsLabel}>
              <button
                type="button"
                aria-pressed={!searching && collection === EVERYTHING}
                onClick={() => {
                  setPicked(EVERYTHING);
                  setQuery("");
                  resetPage();
                }}
              >
                {texts.cosmetics.shop.allTab}
              </button>

              {shopTabs(collections, hasClassics).map((c) => (
                <button
                  key={c?.id ?? "classics"}
                  type="button"
                  aria-pressed={!searching && collection === (c?.id ?? null)}
                  onClick={() => {
                    setPicked(c?.id ?? null);
                    setQuery("");
                    resetPage();
                  }}
                >
                  {c ? c.name : messages.classicTab}
                  {c?.dateLabel && <span className="cos-shop__date">{c.dateLabel}</span>}
                </button>
              ))}
            </div>

            <div
              className="cos-shop__chips cos-shop__chips--kinds"
              role="group"
              aria-label={messages.kindsLabel}
            >
              {(["ALL", ...COSMETIC_KINDS] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => {
                    setKind(k);
                    resetPage();
                  }}
                >
                  {messages.kinds[k]}
                  <span>{counts[k]}</span>
                </button>
              ))}
            </div>
          </div>

          {searching ? (
            <p className="cos-shop__count">{messages.results(listed.length)}</p>
          ) : current ? (
            <header className="cos-shop__collection">
              <h2>{current.name}</h2>
              {current.dateLabel && <p>{current.dateLabel}</p>}
            </header>
          ) : collection === EVERYTHING ? (
            <header className="cos-shop__collection">
              <h2>{texts.cosmetics.shop.allTitle}</h2>

              <p>{texts.cosmetics.shop.allDescription}</p>
            </header>
          ) : (
            <header className="cos-shop__collection">
              <h2>{messages.classicTab}</h2>
            </header>
          )}
          {!searching && current && renderCollectionExtra?.(current.id)}

          {listed.length === 0 ? (
            <p className="cos-shop__empty">
              {searching ? messages.noResults(query.trim()) : messages.emptyKind}
            </p>
          ) : (
            <ul className="cos-shop__grid">{listed.slice(0, visible).map(card)}</ul>
          )}

          {listed.length > 0 && (
            <div className="frame-shop-pagination">
              <p>{messages.showing(Math.min(visible, listed.length), listed.length)}</p>

              {visible < listed.length && (
                <Button variant="outline" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
                  {messages.showMore}
                  <ChevronDown size={15} aria-hidden />
                </Button>
              )}
            </div>
          )}
        </div>

        <aside className="cos-shop__side" aria-label={messages.previewLabel}>
          <ProfileCard profile={preview} effectReplayKey={replay} />

          <div className="cos-shop__panel">
            <p className="cos-shop__trying" aria-live="polite">
              {lookTried
                ? messages.tryingLook(lookTried.title)
                : tryingNames
                  ? messages.trying(tryingNames)
                  : messages.notTrying}
            </p>

            {(preview.profileEffect || isTryingOn(tryOn)) && (
              <div className="cos-shop__panel-actions">
                {preview.profileEffect && (
                  <Button size="sm" variant="outline" onClick={() => setReplay((n) => n + 1)}>
                    <RotateCcw aria-hidden />
                    {messages.replay}
                  </Button>
                )}
                {isTryingOn(tryOn) && (
                  <Button size="sm" variant="outline" onClick={() => setTryOn(EMPTY_TRY_ON)}>
                    <X aria-hidden />
                    {messages.reset}
                  </Button>
                )}
              </div>
            )}

            <div className="cos-shop__member">
              <span>{messages.memberList}</span>

              <div>
                <UserAvatar
                  src={preview.avatar}
                  alt={preview.name}
                  frame={preview.avatarFrame}
                  className="h-[38px] w-[38px]"
                />

                <Nameplate
                  plate={preview.nameplate}
                  badges={<UserBadges badges={preview.badges} />}
                >
                  <StyledName name={preview.name} style={preview.nameStyle} />
                </Nameplate>
              </div>
            </div>
          </div>

          {album && current && (
            <section className="cos-shop__panel cos-album" aria-labelledby={`${headingId}-album`}>
              <header>
                <h3 id={`${headingId}-album`}>{messages.albumTitle}</h3>

                <span>{messages.albumProgress(done, collections.length)}</span>
              </header>

              <div className="cos-album__page">
                <p>
                  {current.name}
                  <span>{messages.albumPage(album.got, album.pieces.length)}</span>
                </p>

                <ul className="cos-album__slots cos-still">
                  {album.pieces.map((item) => (
                    <li key={item.id} className={cn(item.owned && "is-got")} title={item.name}>
                      <CosmeticItemArt item={item} user={user} variant="thumb" />
                    </li>
                  ))}
                </ul>
                {album.pieces.length > 0 && album.got === album.pieces.length && (
                  <p className="cos-album__done">{messages.albumComplete}</p>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
