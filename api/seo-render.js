// Crawler-visible content layer on top of api/seo-handler.js.
//
// seo-handler injects per-page <title>, meta tags, JSON-LD and a <noscript>
// summary. Crawlers that ignore <noscript> (and Semrush's site audit with JS
// rendering disabled) therefore saw a page with no <h1>, almost no text and no
// internal links. This wrapper renders that same per-page content as real HTML
// inside <div id="root">, which React replaces on hydration.

import seoHandler from './_seo-handler.js';

const BASE_URL = 'https://www.renufashionhub.in';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Fashion Blog' },
  { href: '/about', label: 'About Renu Agarwal' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/disclaimer', label: 'Disclaimer' },
];

const CATEGORY_LINKS = [
  { href: '/category/sarees', label: 'Sarees' },
  { href: '/category/kurtas', label: 'Kurtis & Kurta Sets' },
  { href: '/category/lehengas', label: 'Lehengas' },
  { href: '/category/dresses', label: 'Western Dresses' },
  { href: '/category/jewelry', label: 'Jewellery' },
];

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function firstMatch(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function buildRootBlock(html, is404 = false) {
  const noscriptMatch = html.match(/<noscript>([\s\S]*?)<\/noscript>/i);
  if (noscriptMatch && noscriptMatch[1].includes('data-seo-fallback="1"')) {
    return `<div id="root">${noscriptMatch[1]}</div>`;
  }

  if (is404) {
    return `<div id="root">
      <div data-seo-fallback="1" class="rf-ssr-shell">
        <header class="rf-ssr-header">
          <div class="rf-ssr-brand">
            <a href="/" class="rf-ssr-logo">RENU FASHION HUB</a>
            <span class="rf-ssr-tagline">HAUTE COUTURE &amp; STYLING</span>
          </div>
          <nav class="rf-ssr-nav">
            <a href="/">Home</a>
            <a href="/blog">Fashion Blog</a>
            <a href="/contact">Contact</a>
          </nav>
        </header>
        <main class="rf-ssr-main rf-ssr-center">
          <div class="rf-ssr-card rf-ssr-auth-card">
            <h1 style="color: #9e1f3b;">404 — Page Not Found</h1>
            <p>The page you are looking for does not exist, has been removed, or is temporarily unavailable.</p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
              <a href="${BASE_URL}/" class="rf-ssr-pill" style="background: #e11d48; color: #ffffff;">Return to Homepage</a>
              <a href="${BASE_URL}/blog" class="rf-ssr-pill">Explore Fashion Blog</a>
            </div>
            <h2>Popular Collections</h2>
            <ul class="rf-ssr-pill-list" style="justify-content: center;">
              ${CATEGORY_LINKS.map(link => `<li><a href="${link.href}" class="rf-ssr-pill">${escapeHtml(link.label)}</a></li>`).join('')}
            </ul>
          </div>
        </main>
      </div>
    </div>`;
  }

  const noscript = firstMatch(html, /<noscript>([\s\S]*?)<\/noscript>/i);
  const h1 = firstMatch(noscript, /<h1>([\s\S]*?)<\/h1>/i) || 'Renu Fashion Hub';
  const summary = firstMatch(noscript, /<p>([\s\S]*?)<\/p>/i);
  const description = firstMatch(html, /<meta name="description" content="([^"]*)"/i);
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);

  const paragraphs = [summary, description]
    .map((text) => String(text || '').trim())
    .filter((text, index, all) => text && all.indexOf(text) === index);

  return `<div id="root">
    <div data-seo-fallback="1" class="rf-ssr-shell">
      <div class="rf-ssr-topbar">
        <div class="rf-ssr-topbar-inner">
          <span>✨ Curated Indian Haute Couture &amp; Styling Guides by Renu Agarwal · Verified Boutique Links</span>
          <a href="https://wa.me/917248763036" target="_blank" rel="noopener noreferrer">Personal Style Assist: +91 72487 63036</a>
        </div>
      </div>
      <header class="rf-ssr-header">
        <div class="rf-ssr-brand">
          <a href="/" class="rf-ssr-logo">RENU FASHION HUB</a>
          <span class="rf-ssr-tagline">HAUTE COUTURE &amp; STYLING</span>
        </div>
        <nav class="rf-ssr-nav" aria-label="Main Navigation">
          <a href="/">Home</a>
          <a href="/category/sarees">Sarees</a>
          <a href="/category/kurtas">Kurtis &amp; Suits</a>
          <a href="/category/lehengas">Lehengas</a>
          <a href="/category/dresses">Dresses</a>
          <a href="/category/jewelry">Jewellery</a>
          <a href="/blog">Fashion Blog</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>
      <main class="rf-ssr-main">
        <h1>${escapeHtml(h1)}</h1>
        ${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n        ')}
        <div class="rf-ssr-banner">
          <p>Curated Indian Women's Fashion &amp; Styling Inspiration by Renu Agarwal</p>
        </div>
        <h2>Shop by Category</h2>
        <ul class="rf-ssr-pill-list">
          ${CATEGORY_LINKS.map(link => `<li><a href="${link.href}" class="rf-ssr-pill">${escapeHtml(link.label)}</a></li>`).join('')}
        </ul>
        <h2>Explore Renu Fashion Hub</h2>
        <ul class="rf-ssr-pill-list">
          ${NAV_LINKS.map(link => `<li><a href="${link.href}" class="rf-ssr-pill">${escapeHtml(link.label)}</a></li>`).join('')}
        </ul>
      </main>
      <footer class="rf-ssr-footer">
        <ul class="rf-ssr-footer-links">
          ${NAV_LINKS.map(link => `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`).join('')}
        </ul>
        <p style="margin: 0; font-size: 11px; opacity: 0.8;">© 2026 Renu Fashion Hub · Curated by Renu Agarwal. All rights reserved.</p>
      </footer>
    </div>
  </div>`;
}

export default async function handler(req, res) {
  let statusCode = 200;
  let body = '';
  let sent = false;

  const proxy = {
    setHeader: (...args) => res.setHeader(...args),
    getHeader: (...args) => res.getHeader(...args),
    removeHeader: (...args) => res.removeHeader(...args),
    status(code) {
      statusCode = code;
      return proxy;
    },
    redirect(statusOrUrl, maybeUrl) {
      sent = true;
      if (typeof statusOrUrl === 'number') {
        statusCode = statusOrUrl;
        res.setHeader('Location', maybeUrl);
        return res.status(statusCode).end();
      } else {
        statusCode = 302;
        res.setHeader('Location', statusOrUrl);
        return res.status(statusCode).end();
      }
    },
    json(payload) {
      sent = true;
      res.status(statusCode).json(payload);
      return proxy;
    },
    end(payload) {
      body = typeof payload === 'string' ? payload : body;
      return proxy;
    },
    send(payload) {
      body = typeof payload === 'string' ? payload : String(payload || '');
      return proxy;
    },
  };

  try {
    await seoHandler(req, proxy);
  } catch (err) {
    console.error('seo-render: base handler failed:', err);
  }

  if (sent) return;

  if (statusCode >= 300 && statusCode < 400) {
    return res.status(statusCode).end();
  }

  const is404 = statusCode === 404;
  let html = body;
  try {
    if (html && /<div id="root">\s*<\/div>/i.test(html)) {
      html = html.replace(/<div id="root">\s*<\/div>/i, buildRootBlock(html, is404));
    }
  } catch (err) {
    console.error('seo-render: injection failed:', err);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (is404) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400');
  }
  return res.status(statusCode).send(html);
}
