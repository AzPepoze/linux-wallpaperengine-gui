import type { FilterConfig } from './types';

export interface FilterGroup {
    name: string;
    items: string[];
}

export interface FilterCategory {
    name: string;
    items: string[];
    groups?: FilterGroup[];
}

export const mapCategoryToInternal = (category: string): string => {
    switch (category) {
        case 'Type': return 'typetags';
        case 'Genre': return 'tags';
        case 'Age Rating': return 'ratingtags';
        case 'Resolution': return 'resolutiontags';
        case 'Category': return 'categorytags';
        case 'Miscellaneous': return 'utilitytags';
        default: return 'tags';
    }
};

const internalToCategoryName: Record<string, string> = {
    'typetags': 'Type',
    'tags': 'Genre',
    'ratingtags': 'Age Rating',
    'resolutiontags': 'Resolution',
    'categorytags': 'Category',
    'utilitytags': 'Miscellaneous'
};

export const buildFilterCategories = (config: FilterConfig): FilterCategory[] => {
    const categories: FilterCategory[] = [];
    const categoryOrder = ['typetags', 'tags', 'ratingtags', 'resolutiontags', 'categorytags', 'utilitytags'];

    categoryOrder.forEach(internalKey => {
        const rawTagsMap = config[internalKey as keyof FilterConfig];
        if (!rawTagsMap || typeof rawTagsMap !== 'object') return;

        const availableTags = Object.keys(rawTagsMap);
        if (availableTags.length === 0) return;

        if (internalKey !== 'ratingtags') {
            availableTags.sort();
        }

        const categoryName = internalToCategoryName[internalKey] || internalKey;

        if (internalKey === 'resolutiontags') {
            const groupsMap: Record<string, string[]> = {
                'Widescreen': [],
                'Ultra Widescreen': [],
                'Dual Monitor': [],
                'Triple Monitor': [],
                'Portrait Monitor / Phone': [],
                'Other': []
            };

            availableTags.forEach(tag => {
                if (tag.startsWith('Ultrawide')) {
                    groupsMap['Ultra Widescreen'].push(tag);
                } else if (tag.startsWith('Dual')) {
                    groupsMap['Dual Monitor'].push(tag);
                } else if (tag.startsWith('Triple')) {
                    groupsMap['Triple Monitor'].push(tag);
                } else if (tag.startsWith('Portrait')) {
                    groupsMap['Portrait Monitor / Phone'].push(tag);
                } else if (tag.includes('Standard Definition') || tag.match(/^\d+ x \d+$/)) {
                    groupsMap['Widescreen'].push(tag);
                } else {
                    groupsMap['Other'].push(tag);
                }
            });

            const groups: FilterGroup[] = [];
            const groupOrder = ['Widescreen', 'Ultra Widescreen', 'Dual Monitor', 'Triple Monitor', 'Portrait Monitor / Phone', 'Other'];

            groupOrder.forEach(gName => {
                if (groupsMap[gName].length > 0) {
                    groups.push({
                        name: gName,
                        items: groupsMap[gName]
                    });
                }
            });

            categories.push({
                name: categoryName,
                items: [],
                groups: groups
            });
        } else {
            let items = availableTags;
            if (internalKey === 'ratingtags') {
                const ratingOrder = ['Everyone', 'Questionable', 'Mature'];
                items = availableTags.sort((a, b) => ratingOrder.indexOf(a) - ratingOrder.indexOf(b));
            }

            categories.push({
                name: categoryName,
                items: items
            });
        }
    });

    return categories;
};
