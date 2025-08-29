const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security reminder
if (!process.env.IG_APP_ID || !process.env.IG_APP_SECRET || !process.env.IG_REDIRECT_URI) {
  console.warn('⚠️  Missing IG_APP_ID / IG_APP_SECRET / IG_REDIRECT_URI in .env');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: true,
  cookie: { sameSite: 'lax' }
}));

const IG_AUTH_URL = 'https://api.instagram.com/oauth/authorize';
const IG_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const GRAPH_API = 'https://graph.instagram.com';

function requireAuth(req, res, next) {
  if (!req.session.access_token) {
    return res.redirect('/');
  }
  next();
}

app.get('/', (req, res) => {
  res.render('index', {
    loggedIn: Boolean(req.session.access_token),
    username: req.session.username || null
  });
});

// Start OAuth
app.get('/auth', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.IG_APP_ID,
    redirect_uri: process.env.IG_REDIRECT_URI,
    scope: 'user_profile,user_media',
    response_type: 'code'
  });
  res.redirect(`${IG_AUTH_URL}?${params.toString()}`);
});

// OAuth callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  try {
    const formData = new URLSearchParams();
    formData.append('client_id', process.env.IG_APP_ID);
    formData.append('client_secret', process.env.IG_APP_SECRET);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', process.env.IG_REDIRECT_URI);
    formData.append('code', code);

    const tokenRes = await fetch(IG_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Token error:', tokenData);
      return res.status(500).send('Failed to exchange code for token');
    }

    // tokenData: { access_token, user_id }
    req.session.access_token = tokenData.access_token;
    req.session.user_id = tokenData.user_id;

    // Fetch basic profile (username)
    const profileRes = await fetch(`${GRAPH_API}/me?fields=id,username&access_token=${tokenData.access_token}`);
    const profileData = await profileRes.json();
    req.session.username = profileData.username || null;

    res.redirect('/media');
  } catch (err) {
    console.error(err);
    res.status(500).send('OAuth callback failed');
  }
});

// List user's own media
app.get('/media', requireAuth, async (req, res) => {
  try {
    const mediaRes = await fetch(`${GRAPH_API}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${req.session.access_token}`);
    const mediaData = await mediaRes.json();
    if (mediaData.error) {
      console.error(mediaData.error);
      return res.status(500).send('Failed to fetch media');
    }
    res.render('media', { media: mediaData.data || [], username: req.session.username });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching media');
  }
});

// Optional: refresh long-lived token (if you converted to long-lived outside this demo)
app.get('/refresh-token', requireAuth, async (req, res) => {
  try {
    const url = `${GRAPH_API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${req.session.access_token}`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.access_token) {
      req.session.access_token = d.access_token;
    }
    res.json(d);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to refresh' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
