# Social and professional interfaces

One account, two interfaces. The switcher (`components/context-switcher.tsx`, DS `ContextSwitcher`)
sits on top of the main navigation, in the sidebar and in the mobile drawer.

## How the active interface is decided

`lib/interface-context.ts`:

- **The route decides first.** A page that belongs to one interface always opens in it, so a shared
  link lands in the right place and becomes the stored choice:
  - professional: `/vagas`, `/freelances`, `/empresas`, `/empresa`, `/mentoria`, `/servicos`,
    `/meus-servicos`, `/profissional`;
  - social: `/rede`, `/comunidades`, `/grupos`, `/salvos`, `/blogs`, `/blog`, `/eventos`,
    `/par-de-estudo`, `/games`, `/jogos-diarios`, `/projetos`, `/perfil`.
- **Shared pages** (`/feed`, `/mensagens`, `/carteira`, `/seguranca`, ...) follow the last choice,
  kept on the device (`localStorage`, same key as the old identity toggle, which read `CORPORATE`).
- Switching on a shared page stays on it; switching on a page of the other interface goes to `/feed`.
- SSR renders the social interface for shared pages; the device choice applies on hydration
  (`useSyncExternalStore`), without a mismatch.

This is navigation, not authorization: the backend resolves the identity of every operation from the
session (see the backend `docs/SOCIAL_PROFESSIONAL_CONTEXTS.md`).

## What changes per interface

| Area                         | Social                                                                                        | Professional                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Menu (`navigation-items.ts`) | network, communities, groups, saved, blogs, events, study pairs, games, projects, marketplace | jobs, freelances, services, companies, mentoring, professional profile                                           |
| `/feed`                      | community tabs                                                                                | the professional (corporate) feed; the composer signs as the professional identity, or asks to set it up         |
| `/mensagens` and chat dock   | DMs and groups (`context=SOCIAL`)                                                             | applications, freelance proposals, hiring (`context=PROFESSIONAL`); peers shown with their professional identity |
| Notifications                | social + account-wide                                                                         | work + account-wide                                                                                              |
| LinkedIn share offer         | never                                                                                         | after a professional post                                                                                        |

A conversation opened by link (notification, profile) is fetched directly and moves the interface to
the one it belongs to.

## Work actions

Applying to a job (`ApplyJobDialog`) and proposing for a freelance (`ApplyFreelanceDialog`, now
`POST /freelances/{id}/proposals`) show who sends it (`ProfessionalSignature`) or the way to activate
the professional profile; the server refuses them without an active one.
