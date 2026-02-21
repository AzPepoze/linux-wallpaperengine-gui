export interface FilterCategory {
    name: string;
    items: string[];
}

export const filterCategories: FilterCategory[] = [
    {
        name: 'Type',
        items: ['Scene', 'Video', 'Application', 'Web']
    },
    {
        name: 'Genre',
        items: [
            'Abstract',
            'Animal',
            'Anime',
            'Cartoon',
            'CGI',
            'Cyberpunk',
            'Fantasy',
            'Game',
            'Girls',
            'Guys',
            'Landscape',
            'Medieval',
            'Memes',
            'MMD',
            'Music',
            'Nature',
            'Pixel art',
            'Relaxing',
            'Retro',
            'Sci-Fi',
            'Sports',
            'Technology',
            'Television',
            'Vehicle',
            'Unspecified'
        ]
    },
    {
        name: 'Age Rating',
        items: ['Everyone', 'Questionable', 'Mature']
    },
    {
        name: 'Resolution',
        items: [
            'Standard Definition',
            '1280 x 720',
            '1366 x 768',
            '1920 x 1080',
            '2560 x 1440',
            '3840 x 2160',
            'Ultrawide Standard Definition',
            'Ultrawide 2560 x 1080',
            'Ultrawide 3440 x 1440',
            'Dual Standard Definition',
            'Dual 3840 x 1080',
            'Dual 5120 x 1440',
            'Dual 7680 x 2160',
            'Triple Standard Definition',
            'Triple 4096 x 768',
            'Triple 5760 x 1080',
            'Triple 7680 x 1440',
            'Triple 11520 x 2160',
            'Portrait Standard Definition',
            'Portrait 720 x 1280',
            'Portrait 1080 x 1920',
            'Portrait 1440 x 2560',
            'Portrait 2160 x 3840',
            'Other resolution',
            'Dynamic resolution'
        ]
    },
    {
        name: 'Category',
        items: ['Wallpaper', 'Preset', 'Asset']
    },
    {
        name: 'Miscellaneous',
        items: [
            'Approved',
            'Audio responsive',
            '3D',
            'Customizable',
            'Puppet Warp',
            'HDR',
            'Media Integration',
            'User Shortcut',
            'Video Texture',
            'Asset Pack'
        ]
    }
];

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
