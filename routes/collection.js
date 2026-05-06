import express from 'express';
import * as api from '../lib/api.js';

const router = express.Router();

router.get('/collectie', async (req, res) => {
    const collected = await api.getCollectedPlants(res.locals.userId);
    res.render('collectie.liquid', {
        plants: collected.map(p => api.attachMainZone(p, res.locals.allZones)),
        zone_type: 'collectie',
        current_path: req.path,
    });
});

router.get('/collectie/in_bloom', async (req, res) => {
    const collected = await api.getCollectedPlants(res.locals.userId);
    const filtered = collected.filter(p => p.zones && p.zones.length > 0).map(plant => 
        api.attachMainZone(plant, res.locals.allZones)
    );
    res.render('collectie.liquid', { plants: filtered, title: 'In Bloei', zone_type: 'collectie', current_path: req.path });
});

router.get('/collectie/not_in_bloom', async (req, res) => {
    const collected = await api.getCollectedPlants(res.locals.userId);
    const filtered = collected.filter(p => !p.zones || p.zones.length === 0).map(p => api.normalizePlant(p));
    res.render('collectie.liquid', { plants: filtered, title: 'Niet in Bloei', zone_type: 'collectie', current_path: req.path });
});

router.get('/collectie/:plant_slug', async (req, res) => {
    const data = await api.fetchData(`frankendael_plants?filter[slug][_eq]=${req.params.plant_slug}&fields=*.*`);
    if (!data.length) return res.status(404).send('Plant not found');
    res.render('plant-detail.liquid', { plant: api.normalizePlant(data[0]), zone_type: 'collectie', current_path: req.path });
});

export default router;