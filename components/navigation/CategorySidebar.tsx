"use client";

/**
 * CategorySidebar — Left column of the mega menu.
 * Shows categories for the active pillar with pinned items at top.
 */
import React from "react";
import type { TaxonomyNode } from "@/types/navigation";

interface Props {
  categories: TaxonomyNode[];
  selectedId: string | null;
  onSelect: (node: TaxonomyNode) => void;
}

const BADGE_COLORS: Record<string, string> = {
  popular: "bg-orange-100 text-orange-700",
  new: "bg-emerald-100 text-emerald-700",
  updated: "bg-blue-100 text-blue-700",
  trending: "bg-purple-100 text-purple-700",
  urgent: "bg-red-100 text-red-700",
};

export function CategorySidebar({ categories, selectedId, onSelect }: Props) {
  const pinned = categories.filter((c) => c.isPinned);
  const unpinned = categories.filter((c) => !c.isPinned);

  return (
    <div className="w-56 border-r border-gray-100 overflow-y-auto max-h-[calc(70vh-56px)] py-2" role="listbox" aria-label="Categories">
      {/* Pinned items */}
      {pinned.length > 0 && (
        <>
          {pinned.map((node) => (
            <CategoryItem
              key={node.id}
              node={node}
              isSelected={selectedId === node.id}
              onSelect={onSelect}
            />
          ))}
          <div className="mx-3 my-1.5 border-b border-gray-100" />
        </>
      )}

      {/* Regular items */}
      {unpinned.map((node) => (
        <CategoryItem
          key={node.id}
          node={node}
          isSelected={selectedId === node.id}
          onSelect={onSelect}
        />
      ))}

      {categories.length === 0 && (
        <p className="px-4 py-3 text-xs text-gray-400">No categories available</p>
      )}
    </div>
  );
}

function CategoryItem({
  node,
  isSelected,
  onSelect,
}: {
  node: TaxonomyNode;
  isSelected: boolean;
  onSelect: (node: TaxonomyNode) => void;
}) {
  return (
    <button
      onClick={() => onSelect(node)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors duration-100 rounded-r-md ${
        isSelected
          ? "border-l-2 border-primary bg-primary/5 text-primary font-medium"
          : "border-l-2 border-transparent hover:bg-gray-50 text-gray-700"
      }`}
      aria-selected={isSelected}
      role="option"
    >
      {node.icon && <span className="text-sm shrink-0">{node.icon}</span>}
      <span className="flex-1 truncate">{node.label}</span>
      {node.badge && (
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
            BADGE_COLORS[node.badge] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {node.badge}
        </span>
      )}
      {node.showItemCount && node.itemCount > 0 && (
        <span className="text-[10px] text-gray-400 shrink-0">{node.itemCount}</span>
      )}
    </button>
  );
}
