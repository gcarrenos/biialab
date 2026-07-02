'use client';

import { categoryIcon, IconSparkle } from '@/components/icons';

export const ALL_CATEGORY = 'Todos';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

/** Horizontally scrollable chip tabs, one per course category plus "Todos".
 * The active chip gets accent text plus a 2px accent underline; clicking
 * filters the grid client-side via the onChange callback. */
export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  const items = [ALL_CATEGORY, ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {items.map((category) => {
        const isActive = category === active;
        const Icon = category === ALL_CATEGORY ? IconSparkle : categoryIcon(category);
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? 'text-accent border-accent'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            <Icon size={18} className="flex-shrink-0" />
            {category}
          </button>
        );
      })}
    </div>
  );
}
