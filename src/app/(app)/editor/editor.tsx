"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Copy, ExternalLink, GripVertical, Lock, Plus, Trash2, Upload, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { SocialIcon } from "@/lib/socials/icons";
import { platformLabel } from "@/lib/socials/platforms";
import { detectPlatform } from "@/lib/socials/detect";
import { liveCategories, getTheme, plateOf, themesIn } from "@/themes/registry";
import { PhonePlate } from "@/components/phone-plate";
import { BACKDROPS, DEFAULT_BACKDROP, isPresetBackdrop } from "@/themes/backdrops";
import type { InstagramInfo, PageData } from "@/themes/types";
import { MAX_REELS } from "@/themes/options";
import { upload } from "@vercel/blob/client";
import * as A from "./actions";

type L = { id: string; title: string; url: string; enabled: boolean };
type S = { id: string; platform: string; url: string };
type Props = {
  page: { username: string; displayName: string; bio: string; avatarUrl: string | null; themeId: string; backdrop: string | null; layout: "vertical" | "horizontal" | null; instagram: InstagramInfo | null };
  links: L[];
  socials: S[];
  plan: { isPro: boolean; reason: "subscription" | "trial" | "free"; trialDaysLeft: number | null };
  pageUrl: string;
  badgeUrl: string;
  isAdmin: boolean;
  welcome: boolean;
};

function useStatus() {
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "saved" | "error"; msg?: string }>({ kind: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  async function run<T extends { ok: boolean; error?: string }>(p: Promise<T>): Promise<T> {
    setStatus({ kind: "saving" });
    try {
      const r = await p;
      if (!r.ok) setStatus({ kind: "error", msg: r.error });
      else {
        setStatus({ kind: "saved" });
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setStatus({ kind: "idle" }), 1600);
      }
      return r;
    } catch {
      setStatus({ kind: "error", msg: "Couldn't save. Check your connection and try again." });
      return { ok: false, error: "network" } as T;
    }
  }
  return { status, run, clear: () => setStatus({ kind: "idle" }) };
}

function useEditorSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

export function Editor(props: Props) {
  const [profile, setProfile] = useState({ displayName: props.page.displayName, bio: props.page.bio, avatarUrl: props.page.avatarUrl });
  const [links, setLinks] = useState<L[]>(props.links);
  const [socials, setSocials] = useState<S[]>(props.socials);
  const [savedTheme, setSavedTheme] = useState(props.page.themeId);
  const [previewTheme, setPreviewTheme] = useState(props.page.themeId);
  const [backdrop, setBackdropState] = useState(props.page.backdrop);
  const [layout, setLayoutState] = useState(props.page.layout ?? "vertical");
  const [instagram, setInstagramState] = useState<InstagramInfo | null>(props.page.instagram);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);
  const { status, run, clear } = useStatus();
  const sensors = useEditorSensors();

  // Debounced profile save
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => run(A.saveProfile(profile)), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const data: PageData = useMemo(() => ({
    username: props.page.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    links: links.filter((l) => l.enabled),
    socials,
    showBadge: !props.plan.isPro,
    badgeUrl: props.badgeUrl,
    backdrop,
    layout,
    instagram,
  }), [profile, links, socials, props.page.username, props.plan.isPro, props.badgeUrl, backdrop, layout, instagram]);

  const onLinkDrag = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = links.findIndex((l) => l.id === e.active.id);
    const to = links.findIndex((l) => l.id === e.over!.id);
    const next = arrayMove(links, from, to);
    setLinks(next);
    run(A.reorderLinks(next.map((l) => l.id)));
  };
  const onSocialDrag = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(socials, socials.findIndex((s) => s.id === e.active.id), socials.findIndex((s) => s.id === e.over!.id));
    setSocials(next);
    run(A.reorderSocials(next.map((s) => s.id)));
  };

  const pickTheme = async (id: string) => {
    setPreviewTheme(id);
    const t = getTheme(id);
    if (t.pro && !props.plan.isPro) { clear(); return; }
    const r = await run(A.setTheme(id));
    if (r.ok) setSavedTheme(id);
  };

  const previewLocked = getTheme(previewTheme).pro && !props.plan.isPro;

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/" aria-label="Linkmogg home"><Logo className="text-lg" /></Link>
          <span className="hidden h-5 w-px bg-line sm:block" />
          <button type="button" onClick={() => { navigator.clipboard?.writeText(props.pageUrl); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
            className="hidden min-w-0 items-center gap-1.5 rounded-full px-2 py-1 text-sm text-ink-2 hover:bg-black/5 sm:flex">
            <span className="truncate">{props.pageUrl.replace(/^https?:\/\//, "")}</span>
            {copied ? <Check size={14} className="text-forest" /> : <Copy size={14} />}
          </button>
          <span className="flex-1" />
          <span aria-live="polite" className={`text-xs ${status.kind === "error" ? "text-accent-ink" : "text-ink-3"}`}>
            {status.kind === "saving" ? "Saving…" : status.kind === "saved" ? "Saved" : status.kind === "error" ? status.msg : ""}
          </span>
          <Link href="/settings/billing" className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-black/5">
            {props.plan.reason === "subscription" ? "Pro" : props.plan.reason === "trial" ? `Trial · ${props.plan.trialDaysLeft}d left` : "Trial ended · Upgrade"}
          </Link>
          {props.isAdmin ? <Link href="/admin" className="text-sm font-medium text-ink-2 hover:text-ink">Admin</Link> : null}
          <a href={props.pageUrl} target="_blank" rel="noopener" className="btn btn-primary btn-sm"><span className="hidden sm:inline">View page</span><ExternalLink size={14} /></a>
          <form action="/auth/logout" method="post"><button className="text-sm text-ink-3 hover:text-ink">Sign out</button></form>
        </div>
      </header>

      {props.welcome ? (
        <div className="mx-auto mt-4 max-w-6xl px-4">
          <p className="rounded-2xl bg-forest px-4 py-3 text-sm text-white">Your page is live. Add a few links and pick a theme. Your 14-day trial unlocks every theme.</p>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-28 pt-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-12">
        <div className={`flex flex-col gap-5 ${tab === "preview" ? "hidden lg:flex" : ""}`}>
          <ProfileCard profile={profile} setProfile={setProfile} run={run} />

          <section className="card p-5" aria-labelledby="links-h">
            <div className="flex items-center justify-between">
              <h2 id="links-h" className="type-title text-xl">Links</h2>
              <span className="text-xs text-ink-3">Drag to reorder</span>
            </div>
            <AddLink onAdd={async (title, url) => {
              const r = await run(A.addLink({ title, url }));
              if (r.ok && r.data) setLinks((ls) => [...ls, r.data!]);
              return r.ok;
            }} />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLinkDrag}>
              <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <ul className="mt-3 flex flex-col gap-2">
                  {links.map((l) => (
                    <LinkRow key={l.id} link={l}
                      onChange={(patch) => {
                        setLinks((ls) => ls.map((x) => (x.id === l.id ? { ...x, ...patch } : x)));
                        run(A.updateLink(l.id, patch)).then((r) => {
                          if (r.ok && r.data?.url) setLinks((ls) => ls.map((x) => (x.id === l.id ? { ...x, url: r.data!.url } : x)));
                        });
                      }}
                      onDelete={() => { setLinks((ls) => ls.filter((x) => x.id !== l.id)); run(A.deleteLink(l.id)); }} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            {links.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-3">No links yet. Add your first one above.</p> : null}
          </section>

          <section className="card p-5" aria-labelledby="soc-h">
            <h2 id="soc-h" className="type-title text-xl">Social icons</h2>
            <p className="mt-1 text-sm text-ink-2">Paste a profile link. We&apos;ll figure out which platform it is.</p>
            <AddSocial onAdd={async (url) => {
              const r = await run(A.addSocial(url));
              if (r.ok && r.data) setSocials((ss) => [...ss, r.data!]);
              return r.ok;
            }} />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSocialDrag}>
              <SortableContext items={socials.map((s) => s.id)} strategy={rectSortingStrategy}>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <SocialChip key={s.id} s={s} onDelete={() => { setSocials((ss) => ss.filter((x) => x.id !== s.id)); run(A.deleteSocial(s.id)); }} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </section>

          <section className="card p-5" aria-labelledby="theme-h">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="theme-h" className="type-title text-xl">Theme</h2>
              <Link href="/themes" className="text-sm text-ink-2 underline-offset-4 hover:underline">See them all</Link>
            </div>
            {liveCategories().map((c) => (
            <div key={c.id} className="mt-4">
            <h3 className="text-sm font-semibold">{c.name}</h3>
            <ul className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {themesIn(c.id).map((t) => {
                const locked = t.pro && !props.plan.isPro;
                const selected = previewTheme === t.id;
                return (
                  <li key={t.id}>
                    <button type="button" onClick={() => pickTheme(t.id)} aria-pressed={selected}
                      className={`group w-full rounded-2xl border p-2 text-left transition-[border-color,box-shadow,transform] duration-150 ease-out active:scale-[.98] ${selected ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-line hover:border-ink/30"}`}>
                      <span className="relative block h-16 overflow-hidden rounded-xl" style={{ background: plateOf(t.id).bg }}>
                        {savedTheme === t.id ? <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-forest">Live</span> : null}
                        {locked ? <Lock size={14} className="absolute right-2 top-2 text-white mix-blend-difference" aria-label="Pro" /> : null}
                      </span>
                      <span className="mt-2 block px-1 text-sm font-semibold">{t.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            </div>
            ))}
            {previewTheme === "meadow" ? (
              <BackdropPicker value={backdrop} onChange={(v) => { setBackdropState(v); run(A.setBackdrop(v)); }}
                onUploaded={(url) => setBackdropState(url)} run={run} />
            ) : null}
            {previewTheme === "stack" ? (
              <div className="mt-5 border-t border-line pt-4">
                <h3 id="layout-h" className="text-sm font-semibold">Layout</h3>
                <div role="radiogroup" aria-labelledby="layout-h" className="mt-2 inline-flex rounded-full bg-black/5 p-1">
                  {(["vertical", "horizontal"] as const).map((v) => (
                    <button key={v} type="button" role="radio" aria-checked={layout === v} onClick={() => { setLayoutState(v); run(A.setLayout(v)); }}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${layout === v ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}>
                      {v === "vertical" ? "Up and down" : "Sideways"}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {previewTheme === "reels" ? <ReelsPicker value={instagram} onChange={setInstagramState} run={run} /> : null}
          </section>
        </div>

        <aside className={`${tab === "edit" ? "hidden lg:block" : ""}`} aria-label="Live preview">
          <div className="lg:sticky lg:top-20">
            <PhonePlate themeId={previewTheme} data={data} height="h-[min(680px,calc(100dvh-230px))] min-h-[480px]"
              caption={<span className="text-sm font-semibold">{getTheme(previewTheme).name}{savedTheme === previewTheme ? " · live on your page" : " · preview"}</span>} />
            {previewLocked ? (
              <div className="lm-pop mx-auto mt-3 flex max-w-[380px] items-center gap-3 rounded-2xl bg-ink p-3 text-sm text-white">
                <Lock size={16} className="shrink-0" />
                <span className="flex-1">Your trial has ended. You&apos;re previewing {getTheme(previewTheme).name}.</span>
                <Link href="/settings/billing" className="btn btn-accent btn-sm">Upgrade</Link>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center lg:hidden">
        <div role="tablist" className="flex rounded-full bg-ink p-1 shadow-xl">
          {(["edit", "preview"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-colors ${tab === k ? "bg-white text-ink" : "text-white/80"}`}>{k}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ profile, setProfile, run }: {
  profile: { displayName: string; bio: string; avatarUrl: string | null };
  setProfile: React.Dispatch<React.SetStateAction<{ displayName: string; bio: string; avatarUrl: string | null }>>;
  run: <T extends { ok: boolean; error?: string }>(p: Promise<T>) => Promise<T>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  return (
    <section className="card p-5" aria-labelledby="prof-h">
      <h2 id="prof-h" className="type-title text-xl">Profile</h2>
      <div className="mt-4 flex items-start gap-4">
        <div className="flex flex-col items-center gap-2">
          {profile.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.avatarUrl} alt="" className="size-20 shrink-0 rounded-full object-cover ring-1 ring-line" />
            : <div className="grid size-20 shrink-0 place-items-center rounded-full bg-paper-2 font-site text-2xl font-semibold text-ink-2">{(profile.displayName || "?")[0]?.toUpperCase()}</div>}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const fd = new FormData();
            fd.set("file", f);
            start(async () => {
              const r = await run(A.uploadAvatar(fd));
              if (r.ok && r.data) setProfile((p) => ({ ...p, avatarUrl: r.data! }));
            });
          }} />
          <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-sm" disabled={pending}>
            <Upload size={14} /> {pending ? "Uploading" : "Upload"}
          </button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <label className="label" htmlFor="dn">Display name</label>
            <input id="dn" className="field" maxLength={60} value={profile.displayName} onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))} />
          </div>
          <div>
            <div className="flex justify-between"><label className="label" htmlFor="bio">Bio</label><span className="tabular text-xs text-ink-3">{profile.bio.length}/160</span></div>
            <textarea id="bio" className="field min-h-20 resize-y" maxLength={160} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} placeholder="A line about you" />
          </div>
          <div>
            <label className="label" htmlFor="av">Avatar image URL</label>
            <input id="av" className="field text-sm" placeholder="https://…" value={profile.avatarUrl ?? ""} onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value || null }))} />
          </div>
        </div>
      </div>
    </section>
  );
}

function AddLink({ onAdd }: { onAdd: (title: string, url: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary mt-3 w-full"><Plus size={16} /> Add link</button>
    );
  }
  return (
    <form className="lm-pop mt-3 flex flex-col gap-2 rounded-2xl bg-paper-2 p-3" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      const ok = await onAdd(title || url.replace(/^https?:\/\//, "").split("/")[0], url);
      setBusy(false);
      if (ok) { setTitle(""); setUrl(""); setOpen(false); }
    }}>
      <label className="sr-only" htmlFor="nl-url">URL</label>
      <input id="nl-url" className="field" placeholder="URL, like example.com/shop" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus required />
      <label className="sr-only" htmlFor="nl-title">Title</label>
      <input id="nl-title" className="field" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={busy || !url}>{busy ? "Adding…" : "Add"}</button>
      </div>
    </form>
  );
}

function LinkRow({ link, onChange, onDelete }: { link: L; onChange: (p: Partial<L>) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [confirm, setConfirm] = useState(false);
  const [syncedUrl, setSyncedUrl] = useState(link.url);
  if (link.url !== syncedUrl) { setSyncedUrl(link.url); setUrl(link.url); }
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-2xl border border-line bg-white p-2.5 ${isDragging ? "z-10 shadow-xl" : ""} ${link.enabled ? "" : "opacity-60"}`}>
      <button type="button" {...attributes} {...listeners} aria-label={`Reorder ${link.title}`}
        className="mt-1.5 cursor-grab touch-none rounded-md p-1 text-ink-3 hover:bg-black/5 active:cursor-grabbing"><GripVertical size={18} /></button>
      <div className="flex min-w-0 flex-1 flex-col">
        <input aria-label="Link title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
          onBlur={() => title !== link.title && onChange({ title })}
          className="rounded-md px-1.5 py-1 font-medium outline-none hover:bg-paper focus:bg-paper" />
        <input aria-label="Link URL" value={url} onChange={(e) => setUrl(e.target.value)}
          onBlur={() => url !== link.url && onChange({ url })}
          className="rounded-md px-1.5 py-0.5 text-sm text-ink-2 outline-none hover:bg-paper focus:bg-paper" />
      </div>
      <label className="mt-1.5 flex cursor-pointer items-center" title={link.enabled ? "Shown" : "Hidden"}>
        <input type="checkbox" className="peer sr-only" checked={link.enabled} onChange={(e) => onChange({ enabled: e.target.checked })} aria-label={`Show ${link.title}`} />
        <span className="relative h-6 w-10 rounded-full bg-black/15 transition-colors peer-checked:bg-forest peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
      </label>
      {confirm ? (
        <span className="mt-1 flex items-center gap-1">
          <button type="button" onClick={onDelete} className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">Delete</button>
          <button type="button" onClick={() => setConfirm(false)} aria-label="Keep link" className="rounded-full p-1 text-ink-3 hover:bg-black/5"><X size={16} /></button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} aria-label={`Delete ${link.title}`} className="mt-1.5 rounded-md p-1 text-ink-3 hover:bg-black/5 hover:text-accent-ink"><Trash2 size={18} /></button>
      )}
    </li>
  );
}

function AddSocial({ onAdd }: { onAdd: (url: string) => Promise<boolean> }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const detected = value.trim() ? detectPlatform(value) : null;
  return (
    <form className="mt-3 flex gap-2" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      if (await onAdd(value)) setValue("");
      setBusy(false);
    }}>
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2">
          {detected ? <SocialIcon platform={detected.platform} size={18} /> : <Plus size={18} />}
        </span>
        <label htmlFor="soc" className="sr-only">Profile link</label>
        <input id="soc" className="field pl-10" placeholder="instagram.com/yourname" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <button className="btn btn-primary shrink-0" disabled={busy || !detected}>
        {detected ? `Add ${platformLabel(detected.platform)}` : "Add"}
      </button>
    </form>
  );
}

function SocialChip({ s, onDelete }: { s: S; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1 rounded-full border border-line bg-white py-1 pl-1 pr-1.5 ${isDragging ? "z-10 shadow-lg" : ""}`}>
      <button type="button" {...attributes} {...listeners} aria-label={`Reorder ${platformLabel(s.platform)}`}
        className="flex cursor-grab touch-none items-center gap-1.5 rounded-full px-2 py-1 text-sm hover:bg-black/5">
        <SocialIcon platform={s.platform} size={16} color="brand" /> {platformLabel(s.platform)}
      </button>
      <button type="button" onClick={onDelete} aria-label={`Remove ${platformLabel(s.platform)}`} className="rounded-full p-1 text-ink-3 hover:bg-black/5 hover:text-accent-ink"><X size={14} /></button>
    </li>
  );
}

/** Backdrop choices for themes that sit on one. Presets, or the person's own picture. */
function BackdropPicker({ value, onChange, onUploaded, run }: {
  value: string | null; onChange: (v: string) => void; onUploaded: (url: string) => void;
  run: ReturnType<typeof useStatus>["run"];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [url, setUrl] = useState(value && !isPresetBackdrop(value) ? value : "");
  const current = value || DEFAULT_BACKDROP;
  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="text-sm font-semibold">Backdrop</h3>
      <p className="mt-0.5 text-xs text-ink-2">What your desktop sits on. The windy field is the default.</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {BACKDROPS.map((b) => (
          <li key={b.id}>
            <button type="button" onClick={() => onChange(b.id)} aria-pressed={current === b.id} aria-label={b.name}
              className={`block size-14 rounded-xl border-2 transition-transform active:scale-95 ${current === b.id ? "border-ink" : "border-transparent"}`} style={b.style} />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const fd = new FormData(); fd.set("file", f);
          start(async () => { const r = await run(A.uploadBackdrop(fd)); if (r.ok && r.data) onUploaded(r.data); });
        }} />
        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-sm" disabled={pending}>
          <Upload size={14} /> {pending ? "Uploading" : "Upload your own"}
        </button>
        <form className="flex min-w-0 flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); if (url.trim()) onChange(url.trim()); }}>
          <label className="sr-only" htmlFor="bd-url">Backdrop image link</label>
          <input id="bd-url" className="field min-w-0 flex-1 text-sm" placeholder="or paste an image link (https://…)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="submit" className="btn btn-ghost btn-sm">Use</button>
        </form>
      </div>
    </div>
  );
}

/** The Reels theme's settings: an Instagram link for the handle, and the clips that play behind the links. */
function ReelsPicker({ value, onChange, run }: {
  value: InstagramInfo | null; onChange: (v: InstagramInfo) => void;
  run: ReturnType<typeof useStatus>["run"];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState(value?.handle ? `instagram.com/${value.handle}` : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reels = value?.reels ?? [];

  const addFiles = async (files: FileList) => {
    setError(null); setBusy(true);
    let next = reels;
    try {
      for (const f of Array.from(files).slice(0, MAX_REELS)) {
        if (!f.type.startsWith("video/")) { setError(`${f.name} isn't a video.`); continue; }
        if (f.size > 40 * 1024 * 1024) { setError(`${f.name} is over 40 MB. Trim it first.`); continue; }
        const pageId = await A.myPageId();
        const blob = await upload(`reels/${pageId}/${f.name.replace(/[^\w.-]/g, "_")}`, f, { access: "public", handleUploadUrl: "/api/reels/upload" });
        const r = await run(A.addReel(blob.url));
        if (r.ok && r.data) next = r.data;
      }
      onChange({ handle: value?.handle ?? "", reels: next });
    } catch (e) {
      setError(e instanceof Error && /set up/i.test(e.message) ? "Uploads aren't set up yet." : "That upload didn't go through. Try again.");
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="text-sm font-semibold">Instagram</h3>
      <form className="mt-2 flex gap-2" onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(A.setInstagram(link));
        if (r.ok && r.data) onChange({ handle: r.data, reels });
      }}>
        <label className="sr-only" htmlFor="ig-url">Instagram profile link</label>
        <input id="ig-url" className="field min-w-0 flex-1 text-sm" placeholder="instagram.com/yourname" value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" autoComplete="off" />
        <button type="submit" className="btn btn-ghost btn-sm">Save</button>
      </form>
      <h3 className="mt-4 text-sm font-semibold">Reels</h3>
      <p className="mt-0.5 text-xs text-ink-2">Add up to {MAX_REELS} of your own clips. They play small, soft and muted behind your links.</p>
      {reels.length ? (
        <ul className="mt-2 grid grid-cols-6 gap-1.5">
          {reels.map((r) => (
            <li key={r} className="relative aspect-[9/16] overflow-hidden rounded-lg bg-black">
              <video src={`${r}#t=0.1`} muted playsInline preload="metadata" className="size-full object-cover" />
              <button type="button" aria-label="Remove this clip" onClick={async () => { const x = await run(A.removeReel(r)); if (x.ok && x.data) onChange({ handle: value?.handle ?? "", reels: x.data }); }}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"><X size={12} /></button>
            </li>
          ))}
        </ul>
      ) : null}
      <input type="file" accept="video/mp4,video/quicktime,video/webm" multiple ref={fileRef} className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
      <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-sm mt-2" disabled={busy || reels.length >= MAX_REELS}>
        <Upload size={14} /> {busy ? "Uploading" : "Add reel clips"}
      </button>
      {error ? <p className="mt-1 text-xs text-[#b42318]" role="alert">{error}</p> : null}
    </div>
  );
}
