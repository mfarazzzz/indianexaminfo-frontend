"use client";

/**
 * NavigationPanel — 3-column mega menu panel.
 * Composes CategorySidebar (left), SubCategoryPanel (middle), ContextualPanel (right).
 * Positioned fixed below header, full width.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CategorySidebar } from "./CategorySidebar";
import { SubCategoryPanel } from "./SubCategoryPanel";
import { ContextualPanel } from "./ContextualPanel";
import { PanelSearchInput } from "./PanelSearchInput";
import type { NavigationTree, TaxonomyNode } from "@/types/navigation";

interface Props {
  tree: NavigationTree;
  onClose: () => void;
  onPanelMouseEnter: () => void;
  onPanelMouseLeave: () => void;
}

export function NavigationPanel({ tree, onClose, onPanelMouseEnter, onPanelMouseLeave }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Top-level categories (depth 1 nodes)
  const categories = useMemo(() => tree.nodes, [tree.nodes]);

  // Auto-select first category on mount
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Get selected category node
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  // Sub-categories of selected category
  const subCategories = useMemo(
    () => selectedCategory?.children ?? [],
    [selectedCategory]
  );

  // Handle category selection
  const handleCategorySelect = useCallback((node: TaxonomyNode) => {
    setSelectedCategoryId(node.id);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed top-[56px] left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200"
      style={{ maxHeight: "70vh" }}
      role="dialog"
      aria-label={`${tree.label} navigation`}
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      {/* Screen reader announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`${tree.label} navigation panel opened`}
      </div>

      {/* Search bar spanning full width — site-wide real-record search. */}
      <PanelSearchInput onClose={onClose} />

      {/* 3-column layout */}
      <div className="flex max-w-7xl mx-auto" style={{ maxHeight: "calc(70vh - 44px)" }}>
        {/* Left: Category sidebar */}
        <CategorySidebar
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />

        {/* Middle: Sub-categories */}
        {selectedCategory ? (
          <SubCategoryPanel
            parentNode={selectedCategory}
            subCategories={subCategories}
            pillar={tree.pillar}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">Select a category</p>
          </div>
        )}

        {/* Right: Contextual panel */}
        <ContextualPanel pillar={tree.pillar} parentNode={selectedCategory} />
      </div>
    </div>
  );
}
