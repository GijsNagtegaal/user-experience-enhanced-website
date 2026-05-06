import express from 'express';
import * as api from '../lib/api.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const allNews = await api.fetchData('frankendael_news');
    res.render('index.liquid', {
        news: allNews?.map(n => ({ ...n, image: api.assetUrl(n.image) })),
        zone_type: 'home'
    });
});

export default router;