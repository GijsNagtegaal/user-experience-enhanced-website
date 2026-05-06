import * as api from '../lib/api.js';

export const globalData = async (req, res, next) => {
    if (req.path.includes('.') || req.path.startsWith('/gsap')) return next();
    
    const userId = req.cookies.userId ? parseInt(req.cookies.userId, 10) : 9;

    try {
        const [userProfile, allZones, collectedIds] = await Promise.all([
            api.fetchData(`frankendael_users/${userId}?fields=*,memoji.*`),
            api.fetchData('frankendael_zones?fields=*.*'),
            api.getCollectedIds(userId)
        ]);

        res.locals.userId = userId;
        res.locals.user = userProfile || {};
        res.locals.allZones = allZones || [];
        res.locals.collectedIds = collectedIds || new Set();

        const memojiAsset = userProfile?.memoji?.memoji || userProfile?.memoji;
        res.locals.userMemoji = api.assetUrl(memojiAsset);

        next();
    } catch (error) {
        res.locals.userId = userId;
        res.locals.userMemoji = api.PLACEHOLDER_IMAGE;
        next();
    }
};