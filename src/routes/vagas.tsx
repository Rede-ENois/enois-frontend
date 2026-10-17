import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { JOB_LEVELS, JOB_LOCATIONS, JOB_TYPES } from "@/constants/job-options";
import {
  FAKE_JOB_REPORT_REASON,
  JOB_REPORT_REASONS,
  MIN_REPUTATION_TO_CREATE_JOB,
} from "@/constants/job-rules";
import { texts } from "@/texts";
import type { CreateJobInput } from "@/types/application/job/create-job-input";
import type { Job } from "@/types/application/job/job";
import type { JobApplicationFieldInput } from "@/types/application/job/job-application";
import type { JobReportReason } from "@/types/application/job/job-report-reason";
import type { CreateJobDialogProps } from "@/types/routes/jobs/create-job-dialog-props";
import type { ReportJobDialogProps } from "@/types/routes/jobs/report-job-dialog-props";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  CircleHelp,
  Flag,
  Lock,
  MapPin,
  Plus,
  Sparkles,
  X,
  ExternalLink,
} from "lucide-react";

import { jobsApi, reportsApi } from "@/lib/api";
import { CURRENCIES, currencySymbol, formatSalary } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/currency";
import { useCurrentUser } from "@/lib/current-user";
import { canCreateJob, missingReputationToCreateJob } from "@/lib/job-permissions";
import { buildPageShareTags } from "@/lib/open-graph";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { Pill } from "@/components/ui/pill";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import { AppContainer } from "@/components/app-container";
import { InfiniteScroll } from "@/components/infinite-scroll";

export const Route = createFileRoute("/vagas")({
  head: () => ({ meta: buildPageShareTags({ title: texts.jobs.seoTitle, path: "/vagas" }) }),
  component: Vagas,
});

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-transparent bg-muted px-3 py-2 text-sm font-normal text-text-strong outline-none focus-visible:ring-1 focus-visible:ring-ring";

function formatPostedAt(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffD = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffD < 1) return texts.jobs.today;
  if (diffD < 30) return texts.jobs.daysAgo(diffD);
  return date.toLocaleDateString("pt-BR");
}

function Vagas() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [query, setQuery] = useState("");
  // Busca "debounced": sem isso, cada tecla disparava uma requisicao ao backend.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);
  const [level, setLevel] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [skills, setSkills] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [reportTarget, setReportTarget] = useState<Job | null>(null);

  const reputation = user?.reputation ?? 0;
  const canPublish = canCreateJob(reputation);

  const filters = {
    query: debouncedQuery || undefined,
    level: level || undefined,
    location: location || undefined,
    type: type || undefined,
    skills: skills || undefined,
  };

  const { data: jobsData, isFetching } = useQuery({
    queryKey: ["jobs", filters, cursor],
    queryFn: () => jobsApi.list({ ...filters, cursor, limit: 10 }),
    // Cache no front: navegar/focar/voltar nao rebate no backend; 60s de frescor.
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  const jobs = jobsData?.items ?? [];
  const nextCursor = jobsData?.nextCursor ?? null;

  // Reset list when filters change
  const filtersKey = JSON.stringify(filters);
  const prevKey = useRef(filtersKey);
  useEffect(() => {
    if (prevKey.current !== filtersKey) {
      setAllJobs([]);
      setCursor(null);
      prevKey.current = filtersKey;
    }
  }, [filtersKey]);

  // Append new page to accumulated list
  useEffect(() => {
    if (cursor === null && jobs.length > 0) {
      setAllJobs(jobs);
    } else if (cursor !== null && jobs.length > 0) {
      setAllJobs((prev) => [...prev, ...jobs]);
    }
  }, [jobs, cursor]);

  const apply = useMutation({
    mutationFn: (jobId: string) => jobsApi.apply(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const activeCount = [level, location, type].filter(Boolean).length;
  const hasFilters = activeCount > 0 || skills !== "";

  const clearFilters = () => {
    setLevel("");
    setLocation("");
    setType("");
    setSkills("");
  };

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{texts.jobs.title}</h1>

              <p className="mt-1 text-sm text-muted-foreground">{texts.jobs.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasFilters && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full gap-1.5 text-muted-foreground"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4" />

                  <>{texts.jobs.clearFilters}</>
                </Button>
              )}

              <Link
                to="/vagas/minhas"
                className="inline-flex h-9 items-center rounded-full border border-border-soft px-3 text-sm font-medium transition hover:bg-muted"
              >
                {texts.jobs.myJobs}
              </Link>

              <Button
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() => setShowCreate(true)}
              >
                {canPublish ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}

                <>{texts.jobs.createJob}</>
              </Button>
            </div>
          </div>

          {!canPublish && (
            <p className="mt-3 inline-flex items-start gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" />

              <>{texts.jobs.gate.missing(missingReputationToCreateJob(reputation))}</>
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground mr-1">
                {texts.jobs.filters.level}
              </span>
              {JOB_LEVELS.map((l) => (
                <Pill
                  key={l}
                  size="sm"
                  active={level === l}
                  onClick={() => setLevel(level === l ? "" : l)}
                >
                  {l.charAt(0) + l.slice(1).toLowerCase()}
                </Pill>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground mr-1">
                {texts.jobs.filters.location}
              </span>
              {JOB_LOCATIONS.map((l, index) => (
                <Pill
                  key={l}
                  size="sm"
                  active={location === l}
                  onClick={() => setLocation(location === l ? "" : l)}
                >
                  {texts.jobs.filters.locations[index]}
                </Pill>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground mr-1">
                {texts.jobs.filters.type}
              </span>
              {JOB_TYPES.map((t) => (
                <Pill
                  key={t}
                  size="sm"
                  active={type === t}
                  onClick={() => setType(type === t ? "" : t)}
                >
                  {t}
                </Pill>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative max-w-sm flex-1">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={texts.jobs.searchPlaceholder}
                aria-describedby="jobs-search-hint"
                className="h-9 rounded-full bg-muted pl-9"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 gap-1.5 rounded-full"
                >
                  <CircleHelp className="h-4 w-4" />

                  <>{texts.jobs.searchHelp}</>
                </Button>
              </PopoverTrigger>

              <PopoverContent align="start" className="w-[min(calc(100vw-2rem),22rem)] text-sm">
                <p className="font-medium">{texts.jobs.searchHelp}</p>

                <p className="mt-1 text-muted-foreground">{texts.jobs.searchHint}</p>

                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <li>
                    <code>java spring</code> — vagas com os dois termos
                  </li>

                  <li>
                    <code>java -estágio</code> — com java, sem estágio
                  </li>

                  <li>
                    <code>{"(java OR kotlin) senior"}</code> — uma coisa ou outra, e senior
                  </li>

                  <li>
                    <code>"engenheira de dados"</code> — frase inteira
                  </li>
                </ul>
              </PopoverContent>
            </Popover>

            <p id="jobs-search-hint" className="sr-only">
              {texts.jobs.searchHint}
            </p>

            <Input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder={texts.jobs.skillsPlaceholder}
              className="h-9 rounded-full bg-muted max-w-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {allJobs.map((j) => (
            <article key={j.id} className="surface-card flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  {j.logo && <AvatarImage src={j.logo} alt={j.company} className="rounded-xl" />}
                  <AvatarFallback className="rounded-xl">{(j.company ?? j.title ?? "?")[0]}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold">{j.title}</h3>

                  {/* Aviso claro: a vaga NAO foi publicada aqui; a candidatura e na plataforma. */}
                  {j.sourceType === "EXTERNAL" && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-subtle">
                      <ExternalLink className="h-3 w-3" />

                      <>{texts.jobs.externalBadge(j.sourcePlatform ?? "plataforma externa")}</>
                    </span>
                  )}

                  {j.company && (
                    <p className="break-words text-sm text-muted-foreground">{j.company}</p>
                  )}

                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />

                    <>{j.location}</>
                  </p>
                </div>
              </div>

              {j.isFake && (
                <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-3 w-3" />

                  <>{texts.jobs.fakeBadge}</>
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {j.matchScore && (
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />

                    <>{texts.jobs.match(j.matchScore)}</>
                  </span>
                )}
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  {j.type}
                </span>

                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  {j.level}
                </span>
                {formatSalary(j.salary, j.currency) && (
                  <span className="rounded-full bg-growth/15 px-2.5 py-1 font-medium text-growth">
                    {formatSalary(j.salary, j.currency)}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {j.skills.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="rounded-full bg-accent font-normal text-accent-foreground"
                  >
                    {s}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                {j.postedAt && <span>{formatPostedAt(j.postedAt)}</span>}

                {/* wrap + ml-auto: em 320px os três botões descem em vez de estourar o card. */}
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5"
                    onClick={() => setReportTarget(j)}
                  >
                    <Flag className="h-3.5 w-3.5" />

                    <>{texts.jobs.report.action}</>
                  </Button>

                  {/* Vaga externa nao tem detalhe no enois (nao e persistida): so "Visitar vaga". */}
                  {j.sourceType !== "EXTERNAL" && (
                    <Link
                      to="/vagas/$jobId"
                      params={{ jobId: j.id }}
                      className="inline-flex h-9 items-center rounded-full border border-border-soft px-3 text-sm font-medium transition hover:bg-muted"
                    >
                      {texts.jobs.details}
                    </Link>
                  )}

                  {j.sourceType === "EXTERNAL" ? (
                    <a
                      href={j.sourceUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      // text-primary-foreground e obrigatorio aqui: o bloco pai usa text-muted-foreground
                      // e, sem cor propria, o texto do botao herda o cinza sobre o roxo (ilegivel).
                      // Nao use o prefixo `!` de importante do Tailwind v3 — aqui e v4 (sufixo), a
                      // classe com `!` na frente nao gera CSS nenhum.
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />

                      <>{texts.jobs.visit}</>
                    </a>
                  ) : j.applied ? (
                    <Button size="sm" variant="secondary" className="rounded-full gap-1.5" disabled>
                      <CheckCircle2 className="h-3.5 w-3.5" />

                      <>{texts.jobs.applied}</>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={apply.isPending}
                      onClick={() => apply.mutate(j.id)}
                    >
                      {texts.jobs.apply}
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {isFetching && allJobs.length > 0 && <LoadingState className="py-6" />}

        <InfiniteScroll
          hasMore={!!nextCursor}
          loading={isFetching}
          onLoadMore={() => {
            if (nextCursor) setCursor(nextCursor);
          }}
        />

        {!isFetching && allJobs.length === 0 && <EmptyState title={texts.jobs.empty} />}
      </div>

      <CreateJobDialog open={showCreate} onOpenChange={setShowCreate} />
      <ReportJobDialog job={reportTarget} onOpenChange={(open) => !open && setReportTarget(null)} />
    </AppContainer>
  );
}

function CreateJobDialog({ open, onOpenChange }: CreateJobDialogProps) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const reputation = user?.reputation ?? 0;
  const canPublish = canCreateJob(reputation);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState<string>(JOB_LOCATIONS[0]);
  const [type, setType] = useState<string>(JOB_TYPES[0]);
  const [level, setLevel] = useState<string>(JOB_LEVELS[0]);
  const [salary, setSalary] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("BRL");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [fields, setFields] = useState<JobApplicationFieldInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (data: CreateJobInput) => jobsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onOpenChange(false);
    },
    onError: () => setError(texts.jobs.createError),
  });

  const reset = () => {
    setTitle("");
    setCompany("");
    setLocation(JOB_LOCATIONS[0]);
    setType(JOB_TYPES[0]);
    setLevel(JOB_LEVELS[0]);
    setSalary("");
    setCurrency("BRL");
    setSkills("");
    setDescription("");
    setAgreed(false);
    setFields([]);
    setError(null);
  };

  const submit = () => {
    setError(null);
    create.mutate({
      title: title.trim(),
      company: company.trim(),
      location,
      type,
      level,
      salary: salary.trim() || undefined,
      currency,
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description: description.trim() || undefined,
      communityAgreement: agreed,
      applicationFields: fields
        .filter((field) => field.label.trim() !== "")
        .map((field) => ({
          label: field.label.trim(),
          type: field.type,
          required: field.required,
        })),
    });
  };

  const valid = title.trim() !== "" && company.trim() !== "" && agreed;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.jobs.createJobTitle}</DialogTitle>

          <DialogDescription>
            {texts.jobs.createJobDescription} {texts.jobs.gate.community}
          </DialogDescription>
        </DialogHeader>

        {!canPublish ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />

              <div>
                <p className="font-medium text-foreground">{texts.jobs.gate.title}</p>

                <p className="mt-1">
                  {texts.jobs.gate.requirement(MIN_REPUTATION_TO_CREATE_JOB)}{" "}
                  {texts.jobs.gate.current(reputation)}
                </p>

                <p className="mt-1">
                  {texts.jobs.gate.missing(missingReputationToCreateJob(reputation))}
                </p>

                <p className="mt-1">{texts.jobs.gate.community}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-text-subtle">
                {texts.jobs.fields.title}
              </Label>

              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={texts.jobs.fields.titlePlaceholder}
                className="bg-muted"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-text-subtle">
                {texts.jobs.fields.company}
              </Label>

              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={texts.jobs.fields.companyPlaceholder}
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-text-subtle">
                  {texts.jobs.fields.location}
                </Label>

                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {JOB_LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-text-subtle">
                  {texts.jobs.fields.type}
                </Label>

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-text-subtle">
                  {texts.jobs.fields.level}
                </Label>

                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {JOB_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l.charAt(0) + l.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-text-subtle">
                {texts.jobs.fields.salary}
              </Label>

              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className={cn(SELECT_CLASS, "w-32 shrink-0")}
                  aria-label={texts.jobs.fields.currency}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <Input
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder={texts.jobs.fields.salaryPlaceholder}
                  className="bg-muted"
                />
              </div>

              <p className="text-xs font-normal text-text-subtle">
                {texts.jobs.fields.salaryHint(currencySymbol(currency))}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-text-subtle">
                {texts.jobs.fields.skills}
              </Label>

              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder={texts.jobs.fields.skillsPlaceholder}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border-soft p-3">
              <div>
                <p className="text-xs font-medium">{texts.jobs.applicationForm.section}</p>

                <p className="mt-0.5 text-xs font-normal text-text-subtle">
                  {texts.jobs.applicationForm.description}
                </p>
              </div>

              {fields.length === 0 && (
                <p className="text-xs font-normal text-text-subtle">
                  {texts.jobs.applicationForm.empty}
                </p>
              )}

              {fields.map((field, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2">
                  <Input
                    value={field.label}
                    onChange={(event) =>
                      setFields((current) =>
                        current.map((item, position) =>
                          position === index ? { ...item, label: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder={texts.jobs.applicationForm.labelPlaceholder}
                    maxLength={160}
                    className="min-w-0 flex-1 bg-muted"
                  />

                  <select
                    value={field.type}
                    onChange={(event) =>
                      setFields((current) =>
                        current.map((item, position) =>
                          position === index
                            ? {
                                ...item,
                                type: event.target.value as JobApplicationFieldInput["type"],
                              }
                            : item,
                        ),
                      )
                    }
                    className={cn(SELECT_CLASS, "w-40 shrink-0")}
                    aria-label={texts.jobs.applicationForm.section}
                  >
                    {(["TEXT", "TEXTAREA", "NUMBER", "LINK"] as const).map((type) => (
                      <option key={type} value={type}>
                        {texts.jobs.applicationForm.types[type]}
                      </option>
                    ))}
                  </select>

                  <label className="inline-flex shrink-0 items-center gap-1.5 text-xs font-normal text-text-subtle">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(event) =>
                        setFields((current) =>
                          current.map((item, position) =>
                            position === index ? { ...item, required: event.target.checked } : item,
                          ),
                        )
                      }
                      className="h-3.5 w-3.5 accent-primary"
                    />

                    <>{texts.jobs.applicationForm.required}</>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setFields((current) => current.filter((_, position) => position !== index))
                    }
                    className="shrink-0 rounded-full p-1.5 text-destructive transition hover:bg-destructive/10"
                    aria-label={texts.jobs.applicationForm.remove}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() =>
                  setFields((current) => [...current, { label: "", type: "TEXT", required: false }])
                }
              >
                <Plus className="h-3.5 w-3.5" />

                <>{texts.jobs.applicationForm.add}</>
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-text-subtle">
                {texts.jobs.fields.description}
              </Label>

              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={texts.jobs.fields.descriptionPlaceholder}
                className="bg-muted"
              />
            </div>

            <label className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs font-normal text-text-subtle">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />

              <span>{texts.jobs.communityAgreement}</span>
            </label>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              className="w-full rounded-full"
              disabled={!valid || create.isPending}
              onClick={submit}
            >
              {create.isPending ? texts.common.publishing : texts.jobs.createAction}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReportJobDialog({ job, onOpenChange }: ReportJobDialogProps) {
  const [reason, setReason] = useState<JobReportReason>(FAKE_JOB_REPORT_REASON);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const report = useMutation({
    mutationFn: (targetId: string) =>
      reportsApi.create({
        targetId,
        targetType: "JOB",
        reason,
        description: description || undefined,
      }),
    onSuccess: () => setDone(true),
    onError: () => setError(texts.jobs.report.error),
  });

  const reset = () => {
    setReason(FAKE_JOB_REPORT_REASON);
    setDescription("");
    setError(null);
    setDone(false);
  };

  const isFake = reason === FAKE_JOB_REPORT_REASON;

  return (
    <Dialog
      open={!!job}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.jobs.report.title}</DialogTitle>

          <DialogDescription>{job?.title}</DialogDescription>
        </DialogHeader>

        {done ? (
          <p className="pt-2 text-sm text-muted-foreground">{texts.jobs.report.success}</p>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-text-subtle">
                {texts.jobs.report.reason}
              </Label>

              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as JobReportReason)}
                className={SELECT_CLASS}
              >
                {JOB_REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r === FAKE_JOB_REPORT_REASON
                      ? texts.jobs.report.fakeLabel
                      : r.replace(/_/g, " ").toLowerCase()}
                  </option>
                ))}
              </select>

              {isFake && (
                <p className="text-xs text-muted-foreground">{texts.jobs.report.fakeHint}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-text-subtle">
                {texts.jobs.report.description}
              </Label>

              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-muted"
              />
            </div>

            {isFake && (
              <p className="flex items-start gap-1.5 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                <>{texts.jobs.report.fakeWarning}</>
              </p>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              className="w-full rounded-full"
              disabled={report.isPending || !job}
              onClick={() => job && report.mutate(job.id)}
            >
              {report.isPending ? texts.common.sending : texts.jobs.report.action}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
