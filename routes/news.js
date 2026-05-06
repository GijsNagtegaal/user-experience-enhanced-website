import express from 'express';
import * as api from '../lib/api.js';

const router = express.Router();

router.get('/nieuws', async (req, res) => {
    const newsData = await api.fetchData('frankendael_news') || [];
    res.render('nieuws.liquid', {
        news: newsData.map(n => ({ ...n, image: api.assetUrl(n.image) })),
        zone_type: 'news',
        current_path: req.path,
    });
});

router.get('/nieuws/:slug', async (req, res) => {
    const data = await api.fetchData(`frankendael_news?filter[slug][_eq]=${req.params.slug}`);
    if (!data.length) return res.status(404).send('Nieuwsbericht niet gevonden');
    
    res.render('news-detail.liquid', { 
        newsItem: { ...data[0], image: api.assetUrl(data[0].image) }, 
        zone_type: 'news', 
        current_path: req.path 
    });
});

export default router;