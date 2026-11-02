"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import {
  expectedModuleIndex,
  readModuleIndex,
  type ModuleIndexEntry,
} from "@/components/dashboard/module-anchor";
import { cn } from "@/lib/utils";

type ModuleIndexProps = {
  listRef: RefObject<HTMLDivElement | null>;
};

function sameEntries(left: ModuleIndexEntry[], right: ModuleIndexEntry[]) {
  if (left.length !== right.length) return false;
  return left.every((entry, index) => entry.id === right[index]?.id && entry.label === right[index]?.label);
}

function scrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;
  while (node) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === "auto" || overflow === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

function currentSection(entries: ModuleIndexEntry[], root: HTMLElement | null, stickyOffset: number) {
  const rootTop = root ? root.getBoundingClientRect().top : 0;
  const line = rootTop + stickyOffset + 16;
  let current = entries[0]?.id ?? null;
  for (const entry of entries) {
    const element = document.getElementById(entry.id);
    if (!element) continue;
    if (element.getBoundingClientRect().top <= line) current = entry.id;
  }
  return current;
}

function groupsOf(entries: ModuleIndexEntry[]) {
  const groups: { title: string; entries: ModuleIndexEntry[] }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.title === entry.categoryTitle) last.entries.push(entry);
    else groups.push({ title: entry.categoryTitle, entries: [entry] });
  }
  return groups;
}

export function ModuleIndex({ listRef }: ModuleIndexProps) {
  const [entries, setEntries] = useState(expectedModuleIndex);
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  const barRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const suppressUntil = useRef(0);

  useLayoutEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const scanned = readModuleIndex(root);
    if (scanned.length === 0) return;
    setEntries((current) => (sameEntries(current, scanned) ? current : scanned));
  }, [listRef]);

  useEffect(() => {
    if (entries.length === 0) return;
    setActiveId((current) => (current && entries.some((entry) => entry.id === current) ? current : entries[0].id));
  }, [entries]);

  useEffect(() => {
    const root = scrollParent(listRef.current);
    if (!root || entries.length === 0) return;

    let frame = 0;
    const update = () => {
      if (performance.now() < suppressUntil.current) return;
      const desktop = window.matchMedia("(min-width: 1280px)").matches;
      const offset = desktop ? 8 : (barRef.current?.getBoundingClientRect().height ?? 72);
      const next = currentSection(entries, root, offset);
      setActiveId((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const onScrollEnd = () => {
      suppressUntil.current = 0;
      onScroll();
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("scrollend", onScrollEnd);
    update();
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("scroll", onScroll);
      root.removeEventListener("scrollend", onScrollEnd);
    };
  }, [entries, listRef]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !activeId) return;
    const chip = scroller.querySelector<HTMLElement>(`[data-index-target="${activeId}"]`);
    if (!chip) return;
    const left = chip.offsetLeft - (scroller.clientWidth - chip.clientWidth) / 2;
    scroller.scrollTo({ left, behavior: "smooth" });
  }, [activeId]);

  function jump(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    setActiveId(id);
    suppressUntil.current = performance.now() + 1200;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (entries.length === 0) return null;

  const groups = groupsOf(entries);

  return (
    <nav
      ref={barRef}
      aria-label="Indexverzeichnis"
      className="sticky top-0 z-20 rounded-xl border border-white/10 bg-zinc-950 p-2 text-white shadow-[0_12px_24px_-18px_rgba(0,0,0,0.7)] xl:max-h-[calc(100svh-8rem)] xl:overflow-y-auto"
    >
      <p className="px-1.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
        Indexverzeichnis
      </p>
      <div ref={scrollerRef} className="flex gap-1 overflow-x-auto px-0.5 py-1 xl:hidden">
        {entries.map((entry) => (
          <IndexButton key={entry.id} entry={entry} active={entry.id === activeId} nowrap onSelect={jump} />
        ))}
      </div>
      <div className="hidden xl:grid xl:gap-3 xl:px-0.5 xl:pb-1">
        {groups.map((group) => {
          const showTitle = group.entries.length > 1 || group.entries[0]?.label !== group.title;
          return (
            <div key={`${group.title}-${group.entries[0]?.id}`} className="grid gap-0.5">
              {showTitle ? (
                <p className="px-2.5 pt-1 text-lg font-bold tracking-wide text-[#2ee9d6] uppercase">{group.title}</p>
              ) : null}
              <ul className="grid gap-0.5">
                {group.entries.map((entry) => (
                  <li key={entry.id}>
                    <IndexButton entry={entry} active={entry.id === activeId} onSelect={jump} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function IndexButton({
  entry,
  active,
  nowrap = false,
  onSelect,
}: {
  entry: ModuleIndexEntry;
  active: boolean;
  nowrap?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      data-index-target={entry.id}
      aria-current={active ? "location" : undefined}
      onClick={() => onSelect(entry.id)}
      className={cn(
        "rounded-lg border-2 border-transparent px-2.5 py-1.5 text-left text-sm text-zinc-300 hover:bg-white/10 hover:text-white",
        nowrap ? "shrink-0 whitespace-nowrap" : "w-full",
        active && "border-[#2dd4bf] bg-white/10 font-medium text-white shadow-[0_0_0_2px_#16a34a]",
      )}
    >
      {entry.label}
    </button>
  );
}
