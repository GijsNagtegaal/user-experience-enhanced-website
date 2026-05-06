import express from 'express';
import * as api from '../lib/api.js';

const router = express.Router();

router.get('/test', async (req, res) => {
    const memos = await api.fetchData('frankendael_memoji');
    res.render('memo.liquid', {
        memos: memos?.map(n => ({ ...n, image: api.assetUrl(n.image) })),
    });
});

export default router;