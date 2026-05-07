import express from 'express';
import * as api from '../lib/api.js';

const router = express.Router();

router.get('/account', async (req, res) => {
    try {
        const availableMemojis = await api.fetchData('frankendael_memoji') || [];
        const user = res.locals.user;

        const memojis = availableMemojis.map(m => ({
            ...m,
            imageUrl: api.assetUrl(m.memoji),
            selected: m.id === user.memoji
        }));

        res.render('account.liquid', {
            total_plants: res.locals.collectedIds.size,
            memojis,
            current_path: req.path,
        });
    } catch (error) {
        console.error('Account Route Error:', error);
        res.status(500).send('Account error');
    }
});

router.get('/login', (_req, res) => res.render('login.liquid'));
router.get('/welcome', (req, res) => res.render('welcome.liquid', { current_path: req.path }));
router.get('/logout', (_req, res) => { 
    res.clearCookie('userId'); 
    res.redirect('/login'); 
});

router.post('/login', async (req, res) => {
    const { username } = req.body;
    try {
        const allUsers = await api.fetchData('frankendael_users') || [];
        const foundUser = allUsers.find(u => u.name?.toLowerCase() === username.toLowerCase());
        if (foundUser) {
            res.cookie('userId', foundUser.id, { maxAge: 2_592_000_000, httpOnly: true });
            res.redirect('/');
        } else {
            res.status(401).send('Gebruiker niet gevonden');
        }
    } catch (error) {
        res.status(503).send('Inloggen mislukt');
    }
});

router.patch('/account/set-memoji', async (req, res) => {
    const { memojiId } = req.body; 
    try {
        const response = await fetch(`${api.API_BASE}/frankendael_users/${res.locals.userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memoji: Number(memojiId) }),
        });

        if (response.ok) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(200).json({ success: true });
            }
            return res.redirect('/account');
        }
        res.status(response.status).send('Update failed');
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

router.patch('/account/set-accent', async (req, res) => {
    const { accentColor } = req.body; 
    console.log('[accent] PATCH /account/set-accent', {
        userId: res.locals.userId,
        accentColor,
        contentType: req.headers['content-type'],
        accept: req.headers.accept
    });
    try {
        const response = await fetch(`${api.API_BASE}/frankendael_users/${res.locals.userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accent_color: accentColor }),
        });
        let directusBody = null;
        try { directusBody = await response.clone().json(); } catch { directusBody = null; }

        console.log('[accent] directus response', {
            ok: response.ok,
            status: response.status,
            body: directusBody
        });

        if (response.ok) return res.status(200).json({ success: true, userId: res.locals.userId, accentColor });
        res.status(response.status).json({ error: 'Update failed', userId: res.locals.userId, accentColor, directusBody });
    } catch (error) {
        console.error('[accent] server error', error);
        res.status(500).json({ error: 'Server connection failed', userId: res.locals.userId, accentColor });
    }
});

export default router;