'use client';

const CATEGORY_EMOJI: Record<string, string> = {
  'Desarrollo Personal': '🧠',
  'Negocios': '💼',
  'Inteligencia Artificial': '🤖',
  'Machine Learning': '📊',
  'Productividad': '⚡',
  'Data Science': '📈',
  'Programación': '💻',
};

const DEFAULT_EMOJI = '📚';

export const ALL_CATEGORY = 'Todos';

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? DEFAULT_EMOJI;
}

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

/** Horizontally scrollable chip tabs, one per course category plus "Todos".
 * The active chip gets an accent underline; clicking filters the grid
 * client-side via the onChange callback. */
export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  const items = [ALL_CATEGORY, ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {items.map((category) => {
        const isActive = category === active;
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
            <span aria-hidden="true">
              {category === ALL_CATEGORY ? '✨' : categoryEmoji(category)}
            </span>
            {category}
          </button>
        );
      })}
    </div>
  );
}
