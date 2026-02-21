export interface PublishedFileDetails {
	publishedfileid: string;
	result: number;
	title: string;
	description?: string | null;
	owner?: string;
	time_created?: number;
	time_updated?: number;
	visibility?: number;
	banned?: boolean;
	ban_reason?: string;
	subscriptions: number;
	favorites?: number;
	lifetime_subscriptions?: number;
	lifetime_favorited?: number;
	views: number;
	image?: string;
	preview?: string;
	preview_url?: string;
	filename?: string;
	file_url?: string;
	tags?: Array<{ tag: string; display_name: string }> | string[];
	content_type?: number;
	[key: string]: any;
}

export interface WorkshopItem {
	publishedFileId: string;
	title: string;
	description: string;
	thumbnail: string;
	previewUrl: string;
	subscriptions: number;
	views: number;
	tags: string[];
	fileSize?: number;
	timeCreated?: number;
	timeUpdated?: number;
	voteScore?: number;
	// Raw API data - store everything for sidebar display
	[key: string]: any;
}

export function formatWorkshopItem(file: PublishedFileDetails): WorkshopItem {
	// Handle tags that can be either objects or strings
	let formattedTags: string[] = [];
	if (file.tags && Array.isArray(file.tags)) {
		formattedTags = file.tags.map((tag: any) => {
			if (typeof tag === "string") {
				return tag;
			} else if (tag && tag.display_name) {
				return tag.display_name;
			}
			return "";
		});
	}

	// Create workshop item with all API response data
	// Spread file data first, then override with formatted values
	const item: WorkshopItem = {
		...file,
		publishedFileId: file.publishedfileid,
		title: file.title || "Unknown",
		description: file.description || "",
		thumbnail: file.image || "",
		previewUrl: file.preview_url || file.image || "",
		subscriptions: file.subscriptions || 0,
		views: file.views || 0,
		tags: formattedTags,
		fileSize: file.file_size,
		timeCreated: file.time_created,
		timeUpdated: file.time_updated,
		voteScore: file.vote_score,
	};

	return item;
}

export function isValidWorkshopItem(file: PublishedFileDetails): boolean {
	// Filter out items that failed to load (result code 9 or other errors)
	// Result code 1 = success, 9 = file not found
	return !!(file.result === 1 && file.title && file.publishedfileid);
}
