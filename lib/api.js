export const API_BASE = 'https://fdnd-agency.directus.app/items';
export const ASSET_BASE = 'https://fdnd-agency.directus.app/assets';
export const PLACEHOLDER_IMAGE = '/assets/images/placeholder.webp';

export const fetchData = async (endpoint) => {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`);
        const result = await response.json();
        return result.data;
    } catch (e) {
        console.error(`Fetch error for ${endpoint}:`, e);
        return null;
    }
};

export const assetUrl = (asset) => {
    if (!asset) return PLACEHOLDER_IMAGE;
    const id = typeof asset === 'object' ? (asset.id || asset.memoji) : asset;
    return (id && typeof id === 'string') ? `${ASSET_BASE}/${id}` : PLACEHOLDER_IMAGE;
};

export const resolveZoneId = (zoneEntry) =>
    typeof zoneEntry === 'object' ? zoneEntry.frankendael_zones_id : zoneEntry;

export const getPlantIdsFromZone = (zone) => {
    if (!zone.plants?.length) return [];
    return zone.plants
        .map(link => typeof link === 'object' ? link.frankendael_plants_id : link)
        .filter(Boolean);
};

export const normalizePlant = (plant) => {
    if (!plant) return null;
    return {
        ...plant,
        in_bloom: assetUrl(plant.in_bloom),
        not_in_bloom: assetUrl(plant.not_in_bloom),
        title: plant.quest_title || 'Opdracht',
        description: plant.quest_text,
        type: plant.quest_type === 'labels' ? 'button' : 'image',
        correct_answer: (plant.quest_options || []).find(o => o.correct)?.value,
        options: (plant.quest_options || []).map(o => ({
            text: o.label || o.value,
            value: o.value,
            image_url: assetUrl(o.image),
        })),
        xp: 25,
    };
};

export const getCollectedIds = async (userId) => {
    const data = await fetchData(`frankendael_users_plants?filter[frankendael_users_id]=${userId}&fields=frankendael_plants_id`) || [];
    return new Set(data.map(item => {
        const ref = item.frankendael_plants_id;
        return typeof ref === 'object' ? ref.id : ref;
    }));
};

export const getCollectedPlants = async (userId) => {
    const data = await fetchData(`frankendael_users_plants?filter[frankendael_users_id][_eq]=${userId}&fields=*,frankendael_plants_id.*.*`) || [];
    return data.map(item => item.frankendael_plants_id).filter(Boolean);
};

export const attachMainZone = (plant, allZones) => {
    const firstZoneEntry = plant.zones?.[0];
    const zoneId = resolveZoneId(firstZoneEntry);
    return {
        ...normalizePlant(plant),
        main_zone: allZones.find(z => z.id === zoneId) ?? null,
    };
};