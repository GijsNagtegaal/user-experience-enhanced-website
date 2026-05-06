import express from 'express';
import { Liquid } from 'liquidjs';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const API_BASE = 'https://fdnd-agency.directus.app/items';
const PLACEHOLDER_IMAGE = '/assets/images/placeholder.webp';
const DEFAULT_USER_ID = 9;

// ─── APP SETUP ────────────────────────────────────────────────────────────────

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.use(methodOverride('_method'));
app.use('/gsap', express.static(path.join(__dirname, 'node_modules/gsap/dist/')));

const engine = new Liquid();
app.engine('liquid', engine.express());
app.set('views', './views');
app.set('view engine', 'liquid');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Get the active user's ID from their cookie, falling back to the default.
 */
const getActiveUserId = (req) =>
    req.cookies.userId ? parseInt(req.cookies.userId, 10) : DEFAULT_USER_ID;

/**
 * Fetch data from a Directus endpoint and return the `data` array.
 */
const fetchData = async (endpoint) => {
    const response = await fetch(`${API_BASE}/${endpoint}`);
    const result = await response.json();
    return result.data;
};

/**
 * Build a full Directus asset URL from a UUID string or object with an `id`.
 * Falls back to a local placeholder if no asset is provided.
 */
const assetUrl = (asset) => {
    const id = asset && typeof asset === 'object' ? asset.id : asset;
    return id
        ? `https://fdnd-agency.directus.app/assets/${id}`
        : PLACEHOLDER_IMAGE;
};

/**
 * Resolve a zone ID from a zone relation entry (either a raw ID or an object).
 */
const resolveZoneId = (zoneEntry) =>
    typeof zoneEntry === 'object' ? zoneEntry.frankendael_zones_id : zoneEntry;

/**
 * Extract all plant IDs from a zone's `plants` relation array.
 */
const getPlantIdsFromZone = (zone) => {
    if (!zone.plants?.length) return [];
    return zone.plants
        .map(link => typeof link === 'object' ? link.frankendael_plants_id : link)
        .filter(Boolean);
};

/**
 * Normalise a raw plant object into a consistent shape used across all views.
 */
const normalizePlant = (plant) => {
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

/**
 * Return a Set of plant IDs the user has already collected.
 */
const getCollectedIds = async (userId) => {
    const data = await fetchData(
        `frankendael_users_plants?filter[frankendael_users_id]=${userId}&fields=frankendael_plants_id`
    );
    return new Set(
        data.map(item => {
            const ref = item.frankendael_plants_id;
            return typeof ref === 'object' ? ref.id : ref;
        })
    );
};

/**
 * Return the full, expanded plant objects the user has collected.
 */
const getCollectedPlants = async (userId) => {
    const data = await fetchData(
        `frankendael_users_plants?filter[frankendael_users_id][_eq]=${userId}&fields=*,frankendael_plants_id.*.*`
    );
    return data.map(item => item.frankendael_plants_id).filter(Boolean);
};

/**
 * Attach a `main_zone` to a normalised plant, looked up from a zones array.
 */
const attachMainZone = (plant, allZones) => {
    const firstZoneEntry = plant.zones?.[0];
    const zoneId = resolveZoneId(firstZoneEntry);
    return {
        ...normalizePlant(plant),
        main_zone: allZones.find(z => z.id === zoneId) ?? null,
    };
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Home
app.get('/', async (req, res) => {
    const userId = getActiveUserId(req);
    try {
        const [allZones, allNews, collectedPlants, userProfile] = await Promise.all([
            fetchData('frankendael_zones'),
            fetchData('frankendael_news'),
            getCollectedPlants(userId),
            fetchData(`frankendael_users/${userId}`),
        ]);

        res.render('index.liquid', {
            zones: allZones,
            plants: collectedPlants.map(p => attachMainZone(p, allZones)),
            news: allNews.map(n => ({ ...n, image: assetUrl(n.image) })),
            user: userProfile,
            zone_type: 'home',
            current_path: req.path,
        });
    } catch (error) {
        console.error('Home error:', error);
        res.status(500).send('Home error');
    }
});

// Veldverkenner map overview
app.get('/veldverkenner', async (req, res) => {
    const userId = getActiveUserId(req);
    try {
        const [allZones, allPlants, collectedIds] = await Promise.all([
            fetchData('frankendael_zones?fields=*.*'),
            fetchData('frankendael_plants?fields=*.*'),
            getCollectedIds(userId),
        ]);

        const statusMap = {};

        const zonesWithQuest = allZones.map(zone => {
            const plantIdsInZone = getPlantIdsFromZone(zone);
            const isComplete =
                plantIdsInZone.length > 0 &&
                plantIdsInZone.every(id => collectedIds.has(id));

            statusMap[zone.slug] = isComplete;

            const plantWithQuest = allPlants.find(
                p => plantIdsInZone.includes(p.id) && p.quest_title
            );
            const normalized = normalizePlant(plantWithQuest);

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
            progress: collectedIds.size,
            totalZonesCount: zonesWithQuest.length,
            zone_type: 'veldverkenner',
            current_path: req.path,
        });
    } catch (error) {
        console.error('Map error:', error);
        res.status(500).send('Map error');
    }
});

// Single zone view
app.get('/veldverkenner/:zone_slug', async (req, res) => {
    const userId = getActiveUserId(req);
    try {
        const [zoneData, collectedPlants, allZones] = await Promise.all([
            fetchData(`frankendael_zones?filter[slug][_eq]=${req.params.zone_slug}&fields=*.*`),
            getCollectedPlants(userId),
            fetchData('frankendael_zones'),
        ]);

        const currentZone = zoneData[0];
        if (!currentZone) return res.status(404).send('Zone niet gevonden');

        const plantIds = getPlantIdsFromZone(currentZone);
        const plantsInZone = plantIds.length
            ? await fetchData(`frankendael_plants?filter[id][_in]=${plantIds.join(',')}&fields=*.*`)
            : [];

        const collectedIds = new Set(collectedPlants.map(p => p.id));

        const normalizedPlants = plantsInZone.map(plant => {
            const normalized = normalizePlant(plant);
            const zoneId = resolveZoneId(plant.zones?.[0]);
            return {
                ...normalized,
                collected: collectedIds.has(plant.id),
                quest: plant.quest_title ? normalized : null,
                main_zone: allZones.find(z => z.id === zoneId) ?? null,
            };
        });

        const totalCount = normalizedPlants.length;
        const collectedCount = normalizedPlants.filter(p => p.collected).length;

        res.render('zone.liquid', {
            zone: currentZone,
            zone_name: currentZone.name,
            plants: normalizedPlants,
            zone_slug: req.params.zone_slug,
            zone_type: currentZone.type,
            current_path: req.path,
            stats: {
                total: totalCount,
                collected: collectedCount,
                percentage: totalCount > 0 ? (collectedCount / totalCount) * 100 : 0,
            },
        });
    } catch (error) {
        console.error('Zone error:', error);
        res.status(500).send('Zone error');
    }
});

// Single plant quest
app.get('/veldverkenner/:zone_slug/:item_slug', async (req, res) => {
    const userId = getActiveUserId(req);
    try {
        const [zoneData, plantData] = await Promise.all([
            fetchData(`frankendael_zones?filter[slug][_eq]=${req.params.zone_slug}`),
            fetchData(`frankendael_plants?filter[slug][_eq]=${req.params.item_slug}&fields=*.*`),
        ]);
        const plant = normalizePlant(plantData[0]);
        res.render('opdracht.liquid', {
            quest: plant,
            plant,
            zone: zoneData[0],
            zone_slug: req.params.zone_slug,
            state: req.query.step || 'intro',
            user_id: userId,
            zone_type: zoneData[0].type,
            current_path: req.path,
        });
    } catch (error) {
        console.error('Quest error:', error);
        res.status(500).send('Quest error');
    }
});

// Collection overview
app.get('/collectie', async (req, res) => {
    const userId = getActiveUserId(req);
    const [collected, allZones] = await Promise.all([
        getCollectedPlants(userId),
        fetchData('frankendael_zones'),
    ]);
    res.render('collectie.liquid', {
        plants: collected.map(p => attachMainZone(p, allZones)),
        zone_type: 'collectie',
        current_path: req.path,
    });
});

// Collection – in bloom filter
app.get('/collectie/in_bloom', async (req, res) => {
    const userId = getActiveUserId(req);
    const [collected, allZones] = await Promise.all([
        getCollectedPlants(userId),
        fetchData('frankendael_zones'),
    ]);
    const filtered = collected.filter(p => p.zones?.length > 0);
    res.render('collectie.liquid', {
        plants: filtered.map(p => attachMainZone(p, allZones)),
        title: 'In Bloei',
        zone_type: 'collectie',
        current_path: req.path,
    });
});

// Collection – not in bloom filter
app.get('/collectie/not_in_bloom', async (req, res) => {
    const userId = getActiveUserId(req);
    const collected = await getCollectedPlants(userId);
    const filtered = collected.filter(p => !p.zones?.length);
    res.render('collectie.liquid', {
        plants: filtered.map(p => normalizePlant(p)),
        title: 'Niet in Bloei',
        zone_type: 'collectie',
        current_path: req.path,
    });
});

// Single plant detail
app.get('/collectie/:plant_slug', async (req, res) => {
    const data = await fetchData(
        `frankendael_plants?filter[slug][_eq]=${req.params.plant_slug}&fields=*.*`
    );
    if (!data.length) return res.status(404).send('Plant not found');
    res.render('plant-detail.liquid', {
        plant: normalizePlant(data[0]),
        zone_type: 'collectie',
        current_path: req.path,
    });
});

// News overview
app.get('/nieuws', async (req, res) => {
    const newsData = await fetchData('frankendael_news');
    res.render('nieuws.liquid', {
        news: newsData.map(n => ({ ...n, image: assetUrl(n.image) })),
        zone_type: 'news',
        current_path: req.path,
    });
});

// Single news article
app.get('/nieuws/:slug', async (req, res) => {
    const data = await fetchData(`frankendael_news?filter[slug][_eq]=${req.params.slug}`);
    res.render('news-detail.liquid', {
        newsItem: { ...data[0], image: assetUrl(data[0].image) },
        zone_type: 'news',
        current_path: req.path,
    });
});

// Account page
app.get('/account', async (req, res) => {
    const userId = getActiveUserId(req);
    try {
        const [userData, collectedPlants, availableMemojis] = await Promise.all([
            fetchData(`frankendael_users/${userId}`),
            getCollectedPlants(userId),
            fetchData('frankendael_memoji'),
        ]);

        // `userData.memoji` holds the ID of the chosen memoji row (e.g. 3).
        // We look that row up in availableMemojis so we can resolve the asset UUID.
        const activeMemojiRow = availableMemojis.find(m => m.id === userData.memoji);
        userData.avatarUrl = activeMemojiRow
            ? assetUrl(activeMemojiRow.memoji)
            : PLACEHOLDER_IMAGE;

        // Attach a resolved image URL to every available memoji option.
        const memojis = availableMemojis.map(m => ({
            ...m,
            imageUrl: assetUrl(m.memoji),
        }));

        res.render('account.liquid', {
            user: userData,
            total_plants: collectedPlants.length,
            memojis,
            current_path: req.path,
        });
    } catch (error) {
        console.error('Account error:', error);
        res.status(500).send('Account error');
    }
});

// Update chosen memoji
app.patch('/account/set-memoji', async (req, res) => {
    const userId = getActiveUserId(req);
    const { memojiId } = req.body; 

    try {
        const directusResponse = await fetch(`${API_BASE}/frankendael_users/${userId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                memoji: Number(memojiId) 
            }),
        });

        console.log(`📡 Directus Status: ${directusResponse.status} ${directusResponse.statusText}`);

        if (directusResponse.ok) {

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(200).json({ success: true });
            }
            // Fallback for standard form submits
            res.redirect('/account');
        } else {
            const errorData = await directusResponse.json();
            res.status(directusResponse.status).send('Directus update failed');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.patch('/account/set-accent', async (req, res) => {
    const userId = getActiveUserId(req);
    const { accentColor } = req.body; 
    // 1. Validation
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!accentColor) return res.status(400).json({ error: 'No color provided' });

    try {
        // 2. Patch Directus
        const directusResponse = await fetch(`${API_BASE}/frankendael_users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                accent_color: accentColor // Matches your DB field exactly
            }),
        });

        if (directusResponse.ok) {
            // Send back success so the frontend shows the checkmark
            return res.status(200).json({ success: true });
        } else {
            const errorData = await directusResponse.json();
            console.error('Directus Error:', errorData);
            return res.status(directusResponse.status).json(errorData);
        }
    } catch (error) {
        console.error('Connection Error:', error);
        return res.status(500).json({ error: 'Server connection failed' });
    }
});

// Auth
app.get('/login', (_req, res) => res.render('login.liquid'));
app.get('/welcome', (req, res) => res.render('welcome.liquid', { current_path: req.path }));
app.get('/logout', (_req, res) => { res.clearCookie('userId'); res.redirect('/login'); });

// Save collected plant
app.post('/veldverkenner/:zone_slug/:item_slug', async (req, res) => {
    const userId = getActiveUserId(req);
    const { plant_id } = req.body;
    const { zone_slug } = req.params;
    try {
        await fetch(`${API_BASE}/frankendael_users_plants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                frankendael_users_id: userId,
                frankendael_plants_id: parseInt(plant_id, 10),
            }),
        });
        res.redirect(`/veldverkenner/${zone_slug}`);
    } catch (error) {
        console.error('Save plant error:', error);
        res.status(500).send('Save error');
    }
});

// Login
app.post('/login', async (req, res) => {
    const { username } = req.body;
    try {
        const allUsers = await fetchData('frankendael_users');
        const foundUser = allUsers.find(
            u => u.name?.toLowerCase() === username.toLowerCase()
        );
        if (foundUser) {
            res.cookie('userId', foundUser.id, { maxAge: 2_592_000_000, httpOnly: true });
            res.redirect('/');
        } else {
            res.status(401).send('Gebruiker niet gevonden');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(503).send('Inloggen mislukt');
    }
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(8000, () => console.log('🚀 Server started: http://localhost:8000'));