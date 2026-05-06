import express from 'express';
import { Liquid } from 'liquidjs';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';

import { globalData } from './middleware/globals.js';
import * as api from './lib/api.js';

import veldverkennerRoutes from './routes/veldverkenner.js';
import collectionRoutes from './routes/collection.js';
import accountRoutes from './routes/account.js';
import newsRoutes from './routes/news.js';


const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const engine = new Liquid();
app.engine('liquid', engine.express());
app.set('views', './views').set('view engine', 'liquid');

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use('/gsap', express.static(path.join(__dirname, 'node_modules/gsap/dist/')));

app.use(globalData);

app.get('/', async (req, res) => {
    try {
        const [allNews, collectedPlants] = await Promise.all([
            api.fetchData('frankendael_news'),
            api.getCollectedPlants(res.locals.userId),
        ]);
        res.render('index.liquid', {
            zones: res.locals.allZones,
            plants: (collectedPlants || []).map(p => api.attachMainZone(p, res.locals.allZones)),
            news: (allNews || []).map(n => ({ ...n, image: api.assetUrl(n.image) })),
            zone_type: 'home',
            current_path: req.path,
        });
    } catch (e) { res.status(500).send('Home Error'); }
});

app.post('/veldverkenner/:zone_slug/:item_slug', async (req, res) => {
    try {
        await fetch(`${api.API_BASE}/frankendael_users_plants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                frankendael_users_id: res.locals.userId,
                frankendael_plants_id: parseInt(req.body.plant_id, 10),
            }),
        });
        res.redirect(`/veldverkenner/${req.params.zone_slug}`);
    } catch (e) { res.status(500).send('Save Error'); }
});

// Mount External Routers
app.use(veldverkennerRoutes);
app.use(collectionRoutes);
app.use(accountRoutes);
app.use(newsRoutes);

app.listen(8000, () => console.log('🚀 1:1 Modular Server Started: http://localhost:8000'));