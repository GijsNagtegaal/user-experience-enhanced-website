import express from 'express';
import * as api from '../lib/api.js';

const router = express.Router();

router.get('/veldverkenner', async (req, res) => {
    const allPlants = await api.fetchData('frankendael_plants?fields=*.*') || [];
    const statusMap = {};

    const zonesWithQuest = res.locals.allZones.map(zone => {
        const plantIdsInZone = api.getPlantIdsFromZone(zone);
        const isComplete = plantIdsInZone.length > 0 && 
            plantIdsInZone.every(id => res.locals.collectedIds.has(id));

        statusMap[zone.slug] = isComplete;
        const plantWithQuest = allPlants.find(p => plantIdsInZone.includes(p.id) && p.quest_title);
        const normalized = api.normalizePlant(plantWithQuest);

        return {
            ...zone,
            quest: normalized ? { ...normalized, plant: normalized } : null,
            zoneCompleted: isComplete,
        };
    });

    res.render('veldverkenner.liquid', {
        zones: zonesWithQuest,
        completedCount: zonesWithQuest.filter(z => z.zoneCompleted).length,
        status: statusMap,
        progress: res.locals.collectedIds.size,
        totalZonesCount: zonesWithQuest.length,
        zone_type: 'veldverkenner',
        current_path: req.path,
    });
});

router.get('/veldverkenner/:zone_slug', async (req, res) => {
    const zoneData = await api.fetchData(`frankendael_zones?filter[slug][_eq]=${req.params.zone_slug}&fields=*.*`) || [];
    const currentZone = zoneData[0];
    if (!currentZone) return res.status(404).send('Zone niet gevonden');

    const plantIds = api.getPlantIdsFromZone(currentZone);
    const plantsInZone = plantIds.length
        ? await api.fetchData(`frankendael_plants?filter[id][_in]=${plantIds.join(',')}&fields=*.*`)
        : [];

    const normalizedPlants = (plantsInZone || []).map(plant => {
        const normalized = api.normalizePlant(plant);
        const zoneId = api.resolveZoneId(plant.zones?.[0]);
        return {
            ...normalized,
            collected: res.locals.collectedIds.has(plant.id),
            quest: plant.quest_title ? normalized : null,
            main_zone: res.locals.allZones.find(z => z.id === zoneId) ?? null,
        };
    });

    res.render('zone.liquid', {
        zone: currentZone,
        zone_name: currentZone.name,
        plants: normalizedPlants,
        zone_slug: req.params.zone_slug,
        zone_type: currentZone.type,
        current_path: req.path,
        stats: {
            total: normalizedPlants.length,
            collected: normalizedPlants.filter(p => p.collected).length,
            percentage: normalizedPlants.length > 0 ? (normalizedPlants.filter(p => p.collected).length / normalizedPlants.length) * 100 : 0,
        },
    });
});

router.get('/veldverkenner/:zone_slug/:item_slug', async (req, res) => {
    const [zoneData, plantData] = await Promise.all([
        api.fetchData(`frankendael_zones?filter[slug][_eq]=${req.params.zone_slug}`),
        api.fetchData(`frankendael_plants?filter[slug][_eq]=${req.params.item_slug}&fields=*.*`),
    ]);
    const plant = api.normalizePlant(plantData[0]);
    res.render('opdracht.liquid', {
        quest: plant, plant, zone: zoneData[0], zone_slug: req.params.zone_slug,
        state: req.query.step || 'intro', user_id: res.locals.userId,
        zone_type: zoneData[0].type, current_path: req.path,
    });
});

export default router;