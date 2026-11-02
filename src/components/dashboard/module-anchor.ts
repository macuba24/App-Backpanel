import { categoryRegistry, moduleRegistry } from "@/modules/registry";
import type { ModuleKey } from "@/modules/schema";

/** Page order of the Modul-Manager cards. The index follows the anchors in the DOM. */
export const modulePageCategoryIds = ["gamification", "dialog", "marketing", "geofence", "offers", "order", "photos", "push"] as const;

export type ModuleIndexEntry = {
  id: string;
  key: ModuleKey;
  label: string;
  categoryTitle: string;
};

export function moduleDomId(key: ModuleKey) {
  return `modul-${key}`;
}

export function moduleAnchor(key: ModuleKey, className: string) {
  return {
    id: moduleDomId(key),
    "data-module-anchor": key,
    className: `scroll-mt-24 xl:scroll-mt-3 ${className}`,
  };
}

export function isModuleKey(value: string): value is ModuleKey {
  return Object.prototype.hasOwnProperty.call(moduleRegistry, value);
}

/** Labels and order of the modules the Modul-Manager actually renders. */
export function expectedModuleIndex(): ModuleIndexEntry[] {
  return modulePageCategoryIds.flatMap((id) => {
    const category = categoryRegistry.find((item) => item.id === id);
    if (!category) return [];
    return category.keys.map((key) => ({
      id: moduleDomId(key),
      key,
      label: moduleRegistry[key].label,
      categoryTitle: category.title,
    }));
  });
}

/** Index built from anchors present in the rendered module list, in DOM order. */
export function readModuleIndex(root: ParentNode): ModuleIndexEntry[] {
  const entries: ModuleIndexEntry[] = [];
  root.querySelectorAll<HTMLElement>("[data-module-anchor]").forEach((node) => {
    const raw = node.dataset.moduleAnchor;
    if (!raw || !isModuleKey(raw)) return;
    const category = categoryRegistry.find((item) => (item.keys as readonly string[]).includes(raw));
    entries.push({
      id: node.id || moduleDomId(raw),
      key: raw,
      label: moduleRegistry[raw].label,
      categoryTitle: category?.title ?? "",
    });
  });
  return entries;
}
