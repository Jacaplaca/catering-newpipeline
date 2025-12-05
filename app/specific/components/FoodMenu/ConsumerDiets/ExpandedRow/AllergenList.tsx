interface Allergen {
    id: string;
    name: string;
}

interface AllergenListProps {
    allergens?: Allergen[];
    highlightedIds?: string[];
    variant: 'dish' | 'consumer';
}

const AllergenList = ({ allergens, highlightedIds = [], variant }: AllergenListProps) => {
    if (!allergens || allergens.length === 0) {
        return null;
    }

    const variantStyles = {
        dish: 'bg-neutral-200/50 dark:bg-neutral-700/50 text-neutral-900 dark:text-white',
        consumer: 'bg-secondary dark:bg-darkmode-secondary-accent text-black dark:text-white'
    };

    return (
        <div className="flex flex-wrap gap-1">
            {allergens.map((allergen) => {
                const isHighlighted = highlightedIds.includes(allergen.id);
                return (
                    <span
                        key={allergen.id}
                        className={`text-[11px] font-medium ${variantStyles[variant]} px-1 rounded ${isHighlighted ? 'ring-2 ring-red-500 dark:ring-red-400' : ''}`}
                        title={allergen.name}
                    >
                        {allergen.name}
                    </span>
                );
            })}
        </div>
    );
};

export default AllergenList; 