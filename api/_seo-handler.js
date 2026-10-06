// Serverless dynamic SEO and metadata injector for Renu Fashion Hub.
// Injects unique <title>, meta, canonical, og/twitter tags, JSON-LD schema
// and crawler-visible SSR content for static pages, categories, products,
// and blog routes so search engines and AI assistants discover all public URLs
// without executing JavaScript.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { isAdminRequest } from './_auth.js';

dotenv.config();

const baseUrl = "https://www.renufashionhub.in";
const siteName = "Renu Fashion Hub";
const authorName = "Renu Agarwal";
const defaultImage = `${baseUrl}/og-image.jpg`;
const defaultTitle = "Renu Fashion Hub | Sarees, Kurtis, Jewellery & Style Guides by Renu Agarwal";
const defaultDescription = "Renu Fashion Hub by Renu Agarwal — women's fashion inspiration, saree & kurti styling, jewellery picks, outfit ideas and honest shopping guides for Indian women.";

const RAW_SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_URL = RAW_SUPABASE_URL || "https://placeholder.supabase.co";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || "placeholder-key", {
  auth: { persistSession: false, autoRefreshToken: false }
});

/* ---------- helpers ---------- */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripHtml(str) {
  return String(str || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(str, max = 155) {
  const clean = stripHtml(str);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function toIsoDate(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (_) {
    return null;
  }
}

/* ---------- category configurations ---------- */

export const CATEGORY_CONFIGS = {
  sarees: {
    slug: "sarees",
    name: "Sarees",
    dbCategory: "Sarees",
    title: "Designer Sarees Collection | Silk, Organza & Festive Sarees — Renu Fashion Hub",
    description: "Shop designer sarees curated by Renu Agarwal. Banarasi silk, organza, georgette and festive party wear sarees with expert draping and styling tips.",
    h1: "Designer Sarees & Festive Drapes",
    intro: "Explore handcrafted and designer sarees personally styled by Renu Agarwal. From pure silk Banarasi drapes and gossamer organza to contemporary cocktail sarees, discover hand-picked pieces for weddings, festive pujas and special celebrations.",
    blogId: 1782443263146,
    blogTitle: "Top 10 Saree Draping Styles for Festive Season 2026",
    matchKeywords: ["saree"]
  },
  kurtas: {
    slug: "kurtas",
    name: "Kurtis & Kurta Sets",
    dbCategory: "Kurtas",
    title: "Kurtis & Kurta Sets | Office, Festive & Daily Wear — Renu Fashion Hub",
    description: "Explore kurtis and kurta sets handpicked by Renu Agarwal. Anarkalis, straight suits, chikankari kurtis and festive sets with fit and occasion advice.",
    h1: "Kurtis & Designer Kurta Sets",
    intro: "Step into effortless elegance with curated kurtis and designer kurta sets selected by Renu Agarwal. Featuring breathable cotton daily wear, embroidered festive Anarkalis, and sophisticated office suits tailored for comfort and grace.",
    blogId: 1782443263147,
    blogTitle: "How to Style Kurtis for Office and Casual Wear",
    matchKeywords: ["kurta", "kurti", "suit", "anarkali", "chikankari"]
  },
  lehengas: {
    slug: "lehengas",
    name: "Lehengas",
    dbCategory: "Lehengas",
    title: "Bridal & Party Wear Lehengas | Wedding Collection — Renu Fashion Hub",
    description: "Curated bridal, wedding and festive lehengas styled by Renu Agarwal. Complete bridal styling advice, embroidery highlights and wedding wardrobe ideas.",
    h1: "Bridal & Party Wear Lehengas",
    intro: "Discover royal bridal lehengas, bridesmaid ensembles, and festive reception wear curated by Renu Agarwal. Each piece highlights intricate zardozi, mirror work, and rich silk fabrics designed to make unforgettable memories.",
    blogId: 1782443263148,
    blogTitle: "Complete Guide to Choosing the Perfect Bridal Lehenga",
    matchKeywords: ["lehenga", "choli", "semi-stitched", "bridal", "embroidery"]
  },
  dresses: {
    slug: "dresses",
    name: "Western Dresses",
    dbCategory: "Dresses",
    title: "Western Dresses & Outfits | Casual & Party Wear — Renu Fashion Hub",
    description: "Curated western dresses and contemporary styling picks by Renu Agarwal. Maxi dresses, casual wear and evening party dresses tailored for Indian women.",
    h1: "Western Dresses & Contemporary Outfits",
    intro: "Elevate your modern wardrobe with flattering western dresses and fusion wear handpicked by Renu Agarwal. From breezy floral maxis and chic midi dresses to glamorous evening wear created for everyday confidence.",
    blogId: 1782443263149,
    blogTitle: "Western Outfit Ideas for Indian Body Types",
    matchKeywords: ["dress", "maxi", "smocked", "nighty", "western"]
  },
  jewelry: {
    slug: "jewelry",
    name: "Jewellery",
    dbCategory: "Jewelry",
    title: "Jewellery Collection | Necklaces, Earrings & Bangles — Renu Fashion Hub",
    description: "Shop statement jewellery and accessories curated by Renu Agarwal. Kundan chokers, temple jewellery, oxidised earrings and bridal necklace sets.",
    h1: "Jewellery & Accessories Collection",
    intro: "Complete every ethnic and western ensemble with artisanal jewellery chosen by Renu Agarwal. Featuring heirloom Kundan necklaces, temple choker sets, lightweight oxidised silver earrings, and traditional bangles.",
    blogId: 1782443263150,
    blogTitle: "Jewellery Styling: Matching Necklaces with Necklines",
    matchKeywords: ["jewel", "necklace", "earring", "bangle", "choker", "kundan"]
  }
};

export function getCategorySlug(cat) {
  if (!cat) return "sarees";
  const c = String(cat).toLowerCase();
  if (c.includes("saree")) return "sarees";
  if (c.includes("kurta") || c.includes("kurti") || c.includes("suit")) return "kurtas";
  if (c.includes("lehenga") || c.includes("choli")) return "lehengas";
  if (c.includes("dress") || c.includes("nighty")) return "dresses";
  if (c.includes("jewel") || c.includes("neck") || c.includes("ear") || c.includes("bangle")) return "jewelry";
  return "sarees";
}

/* ---------- static page metadata ---------- */

const staticPages = {
  home: {
    title: defaultTitle,
    description: defaultDescription,
    path: "/",
    ogType: "website",
    h1: "Renu Fashion Hub — Women's Fashion, Sarees, Kurtis, Jewellery & Style Guides",
    body: "Renu Fashion Hub, curated by Renu Agarwal, is a destination for Indian women's fashion inspiration: saree styling, kurti trends, lehenga guides, jewellery picks, western outfit ideas, seasonal shopping guides and honest beauty tips."
  },
  about: {
    title: "About Renu Agarwal | Founder of Renu Fashion Hub",
    description: "Meet Renu Agarwal — fashion creator behind Renu Fashion Hub. Her styling journey, editorial mission and philosophy behind every saree, kurti and jewellery pick on the site.",
    path: "/about",
    ogType: "profile",
    h1: "About Renu Agarwal",
    body: "Renu Agarwal is a fashion and lifestyle creator with over 1M followers across Instagram, YouTube and Facebook. Renu Fashion Hub is her curated catalog and editorial home for Indian women's fashion — sarees, kurtis, lehengas, jewellery and everyday styling inspiration."
  },
  blog: {
    title: "Fashion Blog | Saree, Kurti & Styling Guides — Renu Fashion Hub",
    description: "Fashion blog by Renu Agarwal. Trend reports, saree draping guides, kurti pairing ideas, lehenga inspiration, jewellery styling and seasonal shopping guides for Indian women.",
    path: "/blog",
    ogType: "website",
    h1: "Fashion Blog & Editorial Stories",
    body: "Editorial fashion articles by Renu Agarwal covering saree draping and styling, kurti trends, lehenga inspiration, western outfit ideas, jewellery picks and seasonal shopping guides for Indian women."
  },
  contact: {
    title: "Contact Renu Fashion Hub | Styling Enquiries & Support",
    description: "Contact Renu Fashion Hub for styling enquiries, collaboration requests, product questions or support. Email, phone and location details for Renu Agarwal's team.",
    path: "/contact",
    ogType: "website",
    h1: "Contact Renu Fashion Hub",
    body: "Get in touch with the Renu Fashion Hub team for styling questions, collaboration enquiries or support with products featured on the site."
  },
  privacy: {
    title: "Privacy Policy | Renu Fashion Hub",
    description: "Privacy policy of Renu Fashion Hub — what data we collect, how analytics is used, cookie policy and how your contact information is handled.",
    path: "/privacy-policy",
    ogType: "website",
    h1: "Privacy Policy",
    body: "This privacy policy explains what data Renu Fashion Hub collects, how analytics and cookies are used, and how visitor information is handled."
  },
  terms: {
    title: "Terms of Service | Renu Fashion Hub",
    description: "Terms of service for Renu Fashion Hub — operating rules for the catalog, affiliate product recommendations, user-generated content and intellectual property.",
    path: "/terms-of-service",
    ogType: "website",
    h1: "Terms of Service",
    body: "Terms of service governing use of Renu Fashion Hub, affiliate product recommendations and any user-submitted content."
  },
  disclaimer: {
    title: "Disclaimer | Renu Fashion Hub",
    description: "Disclaimer for Renu Fashion Hub — affiliate commission disclosure, third-party product responsibility and accuracy of styling recommendations.",
    path: "/disclaimer",
    ogType: "website",
    h1: "Disclaimer",
    body: "Renu Fashion Hub may earn affiliate commissions on some product links. Product availability and pricing are governed by third-party retailers."
  },
  affiliate: {
    title: "Affiliate Disclosure | Renu Fashion Hub",
    description: "Transparent affiliate disclosure for Renu Fashion Hub adhering to ASCI and FTC guidelines — how commissions support our free styling guides at zero extra cost to you.",
    path: "/affiliate-disclosure",
    ogType: "website",
    h1: "Affiliate Disclosure",
    body: "Renu Fashion Hub partners with trusted retail affiliate networks. When you purchase via our styling recommendations, we may earn a small referral commission at no additional cost to you."
  },
  cookie: {
    title: "Cookie Policy | Renu Fashion Hub",
    description: "Cookie policy of Renu Fashion Hub — details on essential, analytics, and advertising cookies used, and how to manage your privacy and consent preferences.",
    path: "/cookie-policy",
    ogType: "website",
    h1: "Cookie Policy",
    body: "Learn about the cookies and tracking technologies used on Renu Fashion Hub, why they are used, and how you can control your browser cookies."
  },
  admin: {
    title: "Admin Portal | Renu Fashion Hub",
    description: "Administrative control center for Renu Fashion Hub.",
    path: "/admin",
    ogType: "website",
    h1: "Admin Portal",
    body: "Administrative control center for Renu Fashion Hub.",
    extraHead: '<meta name="robots" content="noindex, nofollow" />',
    noRobots: true,
    noCanonical: true
  },
  login: {
    title: "Admin Login | Renu Fashion Hub",
    description: "Administrative authentication for Renu Fashion Hub.",
    path: "/login",
    ogType: "website",
    h1: "Admin Login",
    body: "Administrative authentication for Renu Fashion Hub.",
    extraHead: '<meta name="robots" content="noindex, nofollow" />',
    noRobots: true,
    noCanonical: true
  },
};

/* ---------- JSON-LD builders ---------- */

function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

function websiteAndOrgLd() {
  return [
    jsonLd({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteName,
      "url": `${baseUrl}/`,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }),
    jsonLd({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": siteName,
      "url": `${baseUrl}/`,
      "logo": `${baseUrl}/favicon.svg`,
      "founder": {
        "@type": "Person",
        "name": authorName,
        "sameAs": [
          "https://www.instagram.com/renu_agarwal_vlogs",
          "https://youtube.com/@renuagarwalvlogs",
          "https://www.facebook.com/share/17YfgJkGda/"
        ]
      },
      "sameAs": [
        "https://www.instagram.com/renu_agarwal_vlogs",
        "https://youtube.com/@renuagarwalvlogs",
        "https://www.facebook.com/share/17YfgJkGda/"
      ]
    })
  ].join('\n');
}

function breadcrumbLd(items) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": it.name,
      "item": it.url
    }))
  });
}

function articleLd({ title, description, image, url, datePublished, dateModified }) {
  const obj = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": image ? [image] : undefined,
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
    "url": url,
    "author": { "@type": "Person", "name": authorName, "url": `${baseUrl}/about` },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": { "@type": "ImageObject", "url": `${baseUrl}/favicon.svg` }
    }
  };
  if (datePublished) obj.datePublished = datePublished;
  if (dateModified) obj.dateModified = dateModified;
  return jsonLd(obj);
}

function productLd({ name, description, image, url, price, currency, sku, brand }) {
  const obj = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": image ? [image] : undefined,
    "url": url,
    "brand": { "@type": "Brand", "name": brand || siteName }
  };
  if (sku) obj.sku = String(sku);
  if (price) {
    obj.offers = {
      "@type": "Offer",
      "price": String(price),
      "priceCurrency": currency || "INR",
      "availability": "https://schema.org/InStock",
      "url": url
    };
  }
  return jsonLd(obj);
}

function itemListLd(name, url, items) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": name,
    "url": url,
    "numberOfItems": items.length,
    "itemListElement": items.slice(0, 30).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": p.name,
      "url": `${baseUrl}/product/${p.id}`
    }))
  });
}

/* ---------- data fetchers ---------- */

async function fetchOne(table, id) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  } catch (_) {
    return null;
  }
}

async function fetchPublishedBlogs(limit = 10) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const { data } = await supabase
      .from('blogs')
      .select('*')
      .neq('id', 999999)
      .neq('category', 'site_settings')
      .order('timestamp', { ascending: false })
      .limit(limit);
    return (data || []).filter(b => {
      const status = (b.status || '').toLowerCase();
      if (status === 'draft' || status === 'private' || status === 'pending_review') return false;
      if (b.title === 'ggdf' || String(b.id) === '1782274718063') return false;
      return true;
    });
  } catch (_) {
    return [];
  }
}

async function fetchCuratedProducts(limit = 16) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, description, category, image_url, url')
      .limit(limit);
    return data || [];
  } catch (_) {
    return [];
  }
}

async function fetchCategoryProducts(slug, limit = 30) {
  const conf = CATEGORY_CONFIGS[slug];
  if (!conf) return [];
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];

  try {
    // 1. Fetch exact dbCategory
    let { data: exactMatches } = await supabase
      .from('products')
      .select('id, name, price, description, category, image_url, url')
      .eq('category', conf.dbCategory)
      .limit(limit);

    exactMatches = exactMatches || [];

    // 2. Fetch keyword matches if fewer than 12
    if (exactMatches.length < 12 && conf.matchKeywords.length > 0) {
      const { data: allProducts } = await supabase
        .from('products')
        .select('id, name, price, description, category, image_url, url')
        .limit(250);

      if (allProducts) {
        const existingIds = new Set(exactMatches.map(p => p.id));
        for (const p of allProducts) {
          if (existingIds.has(p.id)) continue;
          const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
          if (conf.matchKeywords.some(kw => text.includes(kw))) {
            exactMatches.push(p);
            existingIds.add(p.id);
            if (exactMatches.length >= limit) break;
          }
        }
      }
    }

    // 3. Fallback to general popular products if category has very few items
    if (exactMatches.length < 6) {
      const { data: popular } = await supabase
        .from('products')
        .select('id, name, price, description, category, image_url, url')
        .limit(16);

      if (popular) {
        const existingIds = new Set(exactMatches.map(p => p.id));
        for (const p of popular) {
          if (!existingIds.has(p.id)) {
            exactMatches.push(p);
            existingIds.add(p.id);
            if (exactMatches.length >= 8) break;
          }
        }
      }
    }

    return exactMatches.slice(0, limit);
  } catch (err) {
    console.error(`fetchCategoryProducts failed for ${slug}:`, err);
    return [];
  }
}

async function fetchRelatedProducts(category, excludeId, limit = 4) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    let query = supabase.from('products').select('id, name, price, description, category, image_url, url');
    if (category) {
      query = query.eq('category', category);
    }
    const { data } = await query.limit(limit + 2);
    return (data || []).filter(p => String(p.id) !== String(excludeId)).slice(0, limit);
  } catch (_) {
    return [];
  }
}

function wrapInShell(innerHtml, isAuth = false, authType = "admin") {
  if (isAuth) {
    const isLogin = authType === "login";
    return `
      <div data-seo-fallback="1" class="rf-ssr-shell">
        <header class="rf-ssr-header">
          <div class="rf-ssr-brand">
            <a href="/" class="rf-ssr-logo">RENU FASHION HUB</a>
            <span class="rf-ssr-tagline">Administrative Control Center</span>
          </div>
          <nav class="rf-ssr-nav">
            <a href="/">Back to Website</a>
          </nav>
        </header>
        <main class="rf-ssr-main rf-ssr-center">
          <div class="rf-ssr-card rf-ssr-auth-card">
            <div class="rf-ssr-auth-icon">${isLogin ? '🔒' : '⚙️'}</div>
            <h1>${isLogin ? 'Admin Authentication' : 'Admin Portal'}</h1>
            <p>${isLogin ? 'Secure access for Renu Fashion Hub administrative management.' : 'Administrative control center and management portal.'}</p>
            <div class="rf-ssr-badge">${isLogin ? 'Loading Login Portal...' : 'Verifying Admin Session...'}</div>
          </div>
        </main>
      </div>
    `;
  }

  return `
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
        ${innerHtml}
      </main>
      <footer class="rf-ssr-footer">
        <ul class="rf-ssr-footer-links">
          <li><a href="/">Home</a></li>
          <li><a href="/category/sarees">Sarees</a></li>
          <li><a href="/category/kurtas">Kurtis &amp; Suits</a></li>
          <li><a href="/category/lehengas">Lehengas</a></li>
          <li><a href="/category/dresses">Western Dresses</a></li>
          <li><a href="/category/jewelry">Jewellery</a></li>
          <li><a href="/blog">Fashion Blog</a></li>
          <li><a href="/about">About Renu Agarwal</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/privacy-policy">Privacy Policy</a></li>
          <li><a href="/terms-of-service">Terms of Service</a></li>
          <li><a href="/disclaimer">Disclaimer</a></li>
          <li><a href="/affiliate-disclosure">Affiliate Disclosure</a></li>
          <li><a href="/cookie-policy">Cookie Policy</a></li>
        </ul>
        <p style="margin: 0; font-size: 11px; opacity: 0.8;">© 2026 Renu Fashion Hub · Curated by Renu Agarwal. All rights reserved.</p>
      </footer>
    </div>
  `;
}

function build404Payload() {
  const inner = `
    <div style="text-align: center; max-width: 680px; margin: 0 auto;">
      <h1 style="color: #881337;">404 — Page Not Found</h1>
      <p>The page you are looking for does not exist, has been removed, or is temporarily unavailable.</p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
        <a href="/" class="rf-ssr-pill" style="background: #e11d48; color: #ffffff;">Return to Homepage</a>
        <a href="/blog" class="rf-ssr-pill">Explore Fashion Blog</a>
        <a href="/contact" class="rf-ssr-pill">Contact Support</a>
      </div>
      <h2>Browse Popular Collections</h2>
      <ul class="rf-ssr-pill-list" style="justify-content: center;">
        ${Object.values(CATEGORY_CONFIGS).map(c => `<li><a href="/category/${c.slug}" class="rf-ssr-pill">${escapeHtml(c.name)}</a></li>`).join('')}
      </ul>
    </div>
  `;

  return {
    is404: true,
    title: "404 Not Found | Renu Fashion Hub",
    description: "The page you are looking for does not exist, has been removed, or is temporarily unavailable. Browse the latest Indian fashion, sarees, and styling guides on Renu Fashion Hub.",
    image: defaultImage,
    url: null,
    ogType: "website",
    h1: "404 — Page Not Found",
    body: "We couldn't find the page you were looking for. Explore our curated collections of sarees, kurtis, jewellery and styling guides, or return to the homepage.",
    extraHead: '<meta name="robots" content="noindex, follow" />',
    richHtml: wrapInShell(inner)
  };
}

/* ---------- SEO payload builders ---------- */

async function buildPayload(type, id, pageName, slug) {
  if (type === "404") {
    return build404Payload();
  }

  // Category Landing Page
  if (type === "category") {
    const rawSlug = String(slug || id || "").toLowerCase().trim();
    const cleanSlug = rawSlug === "jewellery" ? "jewelry" : rawSlug;
    const conf = CATEGORY_CONFIGS[cleanSlug];
    if (!conf) {
      return build404Payload();
    }

    const products = await fetchCategoryProducts(cleanSlug, 30);
    const url = `${baseUrl}/category/${cleanSlug}`;
    const img = (products[0] && (products[0].image_url || products[0].url)) || defaultImage;

    const scripts = [
      websiteAndOrgLd(),
      breadcrumbLd([
        { name: "Home", url: `${baseUrl}/` },
        { name: conf.name, url }
      ]),
      itemListLd(conf.name, url, products)
    ].join('\n');

    const productListHtml = products.length > 0
      ? `
        <section class="category-products-section">
          <h2>Featured ${escapeHtml(conf.name)} (${products.length} Designs)</h2>
          <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;">
            ${products.map(p => `
              <li style="border: 1px solid #e7e5e4; border-radius: 12px; padding: 12px; background: #ffffff;">
                <article>
                  <a href="/product/${p.id}" style="color: inherit; text-decoration: none;">
                    <strong style="display: block; font-size: 14px; margin-bottom: 4px; color: #1c1917;">${escapeHtml(p.name)}</strong>
                    <span style="font-size: 13px; font-weight: 700; color: #e11d48;">₹${escapeHtml(p.price || '')}</span>
                  </a>
                  <p style="font-size: 12px; color: #78716c; margin-top: 6px; line-height: 1.4;">${escapeHtml(truncate(p.description || '', 90))}</p>
                </article>
              </li>
            `).join('')}
          </ul>
        </section>
      `
      : `<p>New designs are being added to our ${escapeHtml(conf.name)} collection daily.</p>`;

    const otherCategories = Object.values(CATEGORY_CONFIGS).filter(c => c.slug !== cleanSlug);

    const innerCategory = `
      <div class="rf-ssr-breadcrumb">
        <a href="/">Home</a> &gt;
        <a href="/blog">Fashion Blog</a> &gt;
        <span>${escapeHtml(conf.name)}</span>
      </div>
      <h1>${escapeHtml(conf.h1)}</h1>
      <p>${escapeHtml(conf.intro)}</p>

      <div class="rf-ssr-banner">
        <p>
          Curated Style Advice by Renu Agarwal: Read our in-depth editorial
          <a href="/blog/${conf.blogId}" style="color: #e11d48; font-weight: 700; text-decoration: underline;">${escapeHtml(conf.blogTitle)}</a>.
        </p>
      </div>

      ${productListHtml}

      <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid var(--rf-border);">
        <h3>Explore Other Collections</h3>
        <ul class="rf-ssr-pill-list">
          ${otherCategories.map(c => `
            <li><a href="/category/${c.slug}" class="rf-ssr-pill">${escapeHtml(c.name)}</a></li>
          `).join('')}
        </ul>
      </div>
    `;

    const richHtml = wrapInShell(innerCategory);

    return {
      title: conf.title,
      description: conf.description,
      image: img,
      url,
      ogType: "website",
      h1: conf.h1,
      body: conf.intro,
      extraHead: scripts,
      richHtml
    };
  }

  // Static pages
  if (type === "page") {
    if (!pageName || !staticPages[pageName]) {
      return build404Payload();
    }
    const page = staticPages[pageName];
    const isSpecialAdmin = pageName === "admin" || pageName === "login";
    const url = `${baseUrl}${page.path}`;
    const scripts = [];
    if (!isSpecialAdmin) {
      scripts.push(websiteAndOrgLd());
      if (page.path !== "/") {
        scripts.push(breadcrumbLd([
          { name: "Home", url: `${baseUrl}/` },
          { name: page.h1, url },
        ]));
      }
    }

    let richHtml = "";

    if (pageName === "admin" || pageName === "login") {
      richHtml = wrapInShell("", true, pageName);
    } else if (pageName === "home") {
      const [curatedProducts, blogs] = await Promise.all([
        fetchCuratedProducts(16),
        fetchPublishedBlogs(6)
      ]);

      const innerHome = `
        <h1>${escapeHtml(page.h1)}</h1>
        <p>${escapeHtml(page.body)}</p>

        <section style="margin-bottom: 36px;">
          <h2>Shop by Category</h2>
          <ul class="rf-ssr-pill-list">
            ${Object.values(CATEGORY_CONFIGS).map(c => `
              <li><a href="/category/${c.slug}" class="rf-ssr-pill">${escapeHtml(c.name)}</a></li>
            `).join('')}
          </ul>
        </section>

        <section style="margin-bottom: 36px;">
          <h2>Trending Fashion Picks</h2>
          <ul class="rf-ssr-grid">
            ${curatedProducts.map(p => `
              <li class="rf-ssr-card">
                <article>
                  <a href="/product/${p.id}">
                    <strong>${escapeHtml(p.name)}</strong>
                    <span class="rf-ssr-price">₹${escapeHtml(p.price || '')}</span>
                  </a>
                </article>
              </li>
            `).join('')}
          </ul>
        </section>

        <section style="margin-bottom: 36px;">
          <h2>Editorial Style Guides & Stories</h2>
          <ul class="rf-ssr-grid">
            ${blogs.map(b => `
              <li class="rf-ssr-card">
                <article>
                  <a href="/blog/${b.id}">
                    <strong>${escapeHtml(b.title)}</strong>
                  </a>
                  <p style="font-size: 13px; margin: 6px 0 10px 0;">${escapeHtml(truncate(b.excerpt || b.content || '', 120))}</p>
                  <a href="/blog/${b.id}" style="font-size: 12px; font-weight: 700;">Read Styling Guide →</a>
                </article>
              </li>
            `).join('')}
          </ul>
        </section>
      `;

      richHtml = wrapInShell(innerHome);
    } else if (pageName === "blog") {
      const blogs = await fetchPublishedBlogs(20);

      const innerBlog = `
        <div class="rf-ssr-breadcrumb">
          <a href="/">Home</a> &gt; <span>Fashion Blog</span>
        </div>
        <h1>${escapeHtml(page.h1)}</h1>
        <p>${escapeHtml(page.body)}</p>

        <section style="margin-bottom: 36px;">
          <h2>All Published Stories (${blogs.length} Articles)</h2>
          <ul class="rf-ssr-grid">
            ${blogs.map(b => `
              <li class="rf-ssr-card">
                <article>
                  <a href="/blog/${b.id}">
                    <strong>${escapeHtml(b.title)}</strong>
                  </a>
                  <p style="font-size: 13px; margin: 6px 0 10px 0;">${escapeHtml(truncate(b.excerpt || b.content || '', 180))}</p>
                  <a href="/blog/${b.id}" style="font-size: 13px; font-weight: 700;">Read Full Article →</a>
                </article>
              </li>
            `).join('')}
          </ul>
        </section>

        <section style="padding-top: 20px; border-top: 1px solid var(--rf-border);">
          <h3>Browse Collections Featured in Our Stories</h3>
          <ul class="rf-ssr-pill-list">
            ${Object.values(CATEGORY_CONFIGS).map(c => `
              <li><a href="/category/${c.slug}" class="rf-ssr-pill">${escapeHtml(c.name)}</a></li>
            `).join('')}
          </ul>
        </section>
      `;

      richHtml = wrapInShell(innerBlog);
    } else {
      const innerStatic = `
        <div class="rf-ssr-breadcrumb">
          <a href="/">Home</a> &gt; <span>${escapeHtml(page.h1)}</span>
        </div>
        <h1>${escapeHtml(page.h1)}</h1>
        <p>${escapeHtml(page.body)}</p>
        <div class="rf-ssr-banner">
          <p>Curated Indian Women's Fashion & Styling Inspiration by Renu Agarwal</p>
        </div>
        <h2>Explore Collections</h2>
        <ul class="rf-ssr-pill-list">
          ${Object.values(CATEGORY_CONFIGS).map(c => `
            <li><a href="/category/${c.slug}" class="rf-ssr-pill">${escapeHtml(c.name)}</a></li>
          `).join('')}
        </ul>
      `;

      richHtml = wrapInShell(innerStatic);
    }

    return {
      title: page.title,
      description: page.description,
      image: defaultImage,
      url,
      ogType: page.ogType,
      h1: page.h1,
      body: page.body,
      extraHead: scripts.join('\n'),
      richHtml
    };
  }

  // Blog Detail
  if (type === "blog") {
    const cleanId = String(id || "").split("?")[0];
    const numeric = parseInt(cleanId, 10);
    if (Number.isFinite(numeric)) {
      const data = await fetchOne("blogs", numeric);
      if (data && data.id !== 999999 && data.category !== "site_settings") {
        const title = data.seo_title || `${data.title} | Renu Fashion Hub`;
        const description = truncate(data.meta_description || data.excerpt || data.content || defaultDescription);
        const image = data.image_url || defaultImage;
        const url = `${baseUrl}/blog/${cleanId}`;
        const datePublished = toIsoDate(data.created_at || data.timestamp);
        const dateModified = toIsoDate(data.updated_at || data.created_at || data.timestamp);
        const catSlug = getCategorySlug(data.category || data.title);
        const catConf = CATEGORY_CONFIGS[catSlug] || CATEGORY_CONFIGS.sarees;

        const [contextualProducts, otherBlogs] = await Promise.all([
          fetchCategoryProducts(catSlug, 4),
          fetchPublishedBlogs(4)
        ]);

        const scripts = [
          articleLd({ title, description, image, url, datePublished, dateModified }),
          breadcrumbLd([
            { name: "Home", url: `${baseUrl}/` },
            { name: "Blog", url: `${baseUrl}/blog` },
            { name: stripHtml(data.title || title), url },
          ])
        ].join('\n');

        const innerBlogDetail = `
          <div class="rf-ssr-breadcrumb">
            <a href="/">Home</a> &gt;
            <a href="/blog">Fashion Blog</a> &gt;
            <span>${escapeHtml(stripHtml(data.title || title))}</span>
          </div>
          <h1>${escapeHtml(stripHtml(data.title || title))}</h1>
          <p style="font-size: 15px; line-height: 1.7; margin-bottom: 24px;">${escapeHtml(truncate(data.content || data.excerpt || description, 600))}</p>

          <div class="rf-ssr-banner">
            <p>
              Explore designs featured in this guide:
              <a href="/category/${catConf.slug}" style="color: #e11d48; font-weight: 700;">${escapeHtml(catConf.name)} Collection</a>.
            </p>
          </div>

          ${contextualProducts.length > 0 ? `
            <section style="margin: 32px 0;">
              <h2>Related Outfits &amp; Styling Picks</h2>
              <ul class="rf-ssr-grid">
                ${contextualProducts.map(p => `
                  <li class="rf-ssr-card">
                    <article>
                      <a href="/product/${p.id}">
                        <strong>${escapeHtml(p.name)}</strong>
                        <span class="rf-ssr-price">₹${escapeHtml(p.price || '')}</span>
                      </a>
                    </article>
                  </li>
                `).join('')}
              </ul>
            </section>
          ` : ''}

          <nav style="margin-top: 36px; padding-top: 20px; border-top: 1px solid var(--rf-border);">
            <h3>More Fashion Guides</h3>
            <ul class="rf-ssr-pill-list">
              ${otherBlogs.filter(b => String(b.id) !== cleanId).slice(0, 3).map(b => `
                <li><a href="/blog/${b.id}" class="rf-ssr-pill">${escapeHtml(b.title)}</a></li>
              `).join('')}
            </ul>
          </nav>
        `;

        const richHtml = wrapInShell(innerBlogDetail);

        return {
          title,
          description,
          image,
          url,
          ogType: "article",
          h1: stripHtml(data.title || title),
          body: truncate(data.excerpt || data.content || description, 600),
          extraHead: scripts,
          richHtml
        };
      }
    }
    return build404Payload();
  }

  // Product Detail
  if (type === "product") {
    const cleanId = String(id || "").split("?")[0];
    const numeric = parseInt(cleanId, 10);
    if (Number.isFinite(numeric)) {
      const data = await fetchOne("products", numeric);
      if (data) {
        const title = `${data.name} | Renu Fashion Hub`;
        const description = truncate(data.description || `${data.name} — fashion pick, styling details and shopping guide at Renu Fashion Hub.`);
        const image = data.image_url || data.url || defaultImage;
        const url = `${baseUrl}/product/${cleanId}`;
        const catSlug = getCategorySlug(data.category || data.name);
        const catConf = CATEGORY_CONFIGS[catSlug] || CATEGORY_CONFIGS.sarees;

        const relatedProducts = await fetchRelatedProducts(data.category, cleanId, 4);

        const scripts = [
          productLd({
            name: data.name,
            description,
            image,
            url,
            price: data.price,
            currency: data.currency,
            sku: data.sku || data.id,
            brand: data.brand,
          }),
          breadcrumbLd([
            { name: "Home", url: `${baseUrl}/` },
            { name: catConf.name, url: `${baseUrl}/category/${catConf.slug}` },
            { name: data.name, url },
          ])
        ].join('\n');

        const innerProductDetail = `
          <div class="rf-ssr-breadcrumb">
            <a href="/">Home</a> &gt;
            <a href="/category/${catConf.slug}">${escapeHtml(catConf.name)}</a> &gt;
            <span>${escapeHtml(data.name)}</span>
          </div>
          <h1>${escapeHtml(data.name)}</h1>
          <p class="rf-ssr-price" style="font-size: 22px; margin-bottom: 16px;">₹${escapeHtml(data.price || '')}</p>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">${escapeHtml(truncate(data.description || description, 600))}</p>

          <div class="rf-ssr-banner">
            <p>
              Part of our <a href="/category/${catConf.slug}" style="color: #e11d48; font-weight: 700;">${escapeHtml(catConf.name)} Collection</a>.
              Read Renu Agarwal's styling guide:
              <a href="/blog/${catConf.blogId}" style="color: #e11d48; font-weight: 700; text-decoration: underline;">${escapeHtml(catConf.blogTitle)}</a>.
            </p>
          </div>

          ${relatedProducts.length > 0 ? `
            <section style="margin: 32px 0;">
              <h2>You May Also Like in ${escapeHtml(catConf.name)}</h2>
              <ul class="rf-ssr-grid">
                ${relatedProducts.map(p => `
                  <li class="rf-ssr-card">
                    <article>
                      <a href="/product/${p.id}">
                        <strong>${escapeHtml(p.name)}</strong>
                        <span class="rf-ssr-price">₹${escapeHtml(p.price || '')}</span>
                      </a>
                    </article>
                  </li>
                `).join('')}
              </ul>
            </section>
          ` : ''}
        `;

        const richHtml = wrapInShell(innerProductDetail);

        return {
          title,
          description,
          image,
          url,
          ogType: "product",
          h1: data.name,
          body: truncate(data.description || description, 600),
          extraHead: scripts,
          richHtml
        };
      }
    }
    return build404Payload();
  }

  // Post Detail
  if (type === "post") {
    const cleanId = String(id || "").split("?")[0];
    const numeric = parseInt(cleanId, 10);
    if (Number.isFinite(numeric)) {
      const data = await fetchOne("posts", numeric);
      if (data) {
        const title = `${data.caption ? stripHtml(data.caption).slice(0, 60) : `Fashion Style Post ${cleanId}`} | Renu Fashion Hub`;
        const description = truncate(data.caption || "Latest outfit style, lookbook and collection recommendation from Renu Fashion Hub.");
        const image = data.type === "image" && data.url ? data.url : defaultImage;
        const url = `${baseUrl}/post/${cleanId}`;
        const datePublished = toIsoDate(data.created_at || data.timestamp);
        const scripts = [
          articleLd({ title, description, image, url, datePublished }),
          breadcrumbLd([
            { name: "Home", url: `${baseUrl}/` },
            { name: "Posts", url: `${baseUrl}/` },
            { name: title.replace(" | Renu Fashion Hub", ""), url },
          ])
        ].join('\n');

        const innerPostDetail = `
          <div class="rf-ssr-breadcrumb">
            <a href="/">Home</a> &gt; <span>Fashion Post</span>
          </div>
          <h1>${escapeHtml(title.replace(" | Renu Fashion Hub", ""))}</h1>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">${escapeHtml(truncate(data.caption || description, 400))}</p>
          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <a href="/" class="rf-ssr-pill" style="background: #e11d48; color: #ffffff;">Return to Homepage</a>
            <a href="/blog" class="rf-ssr-pill">Fashion Blog</a>
          </div>
        `;

        const richHtml = wrapInShell(innerPostDetail);

        return {
          title,
          description,
          image,
          url,
          ogType: "article",
          h1: title.replace(" | Renu Fashion Hub", ""),
          body: truncate(data.caption || description, 400),
          extraHead: scripts,
          richHtml
        };
      }
    }
    return build404Payload();
  }

  // Fallback for any unknown route is 404
  return build404Payload();
}

/* ---------- HTML template loader ---------- */

function loadTemplate() {
  try {
    const distPath = path.join(process.cwd(), "dist", "index.html");
    if (fs.existsSync(distPath)) return fs.readFileSync(distPath, "utf8");
  } catch (_) {}
  try {
    return fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
  } catch (_) {
    return `<!doctype html><html lang="en-IN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head><body><div id="root"></div></body></html>`;
  }
}

/* ---------- handler ---------- */

export default async function handler(req, res) {
  const { type, id, name, slug } = req.query || {};

  if (type === "page" && name === "admin") {
    if (!isAdminRequest(req)) {
      res.setHeader("Location", "/login");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.status(307).end();
    }
  }

  if (type === "page" && name === "login") {
    if (isAdminRequest(req)) {
      res.setHeader("Location", "/admin");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.status(307).end();
    }
  }

  let payload;
  try {
    payload = await buildPayload(type, id, name, slug);
  } catch (err) {
    console.error("seo-handler payload error:", err);
    payload = build404Payload();
  }

  let html = loadTemplate();

  const is404 = Boolean(payload.is404);
  const isNonIndexable = Boolean(payload.noRobots || payload.extraHead?.includes("noindex") || is404);

  try {
    // Strip existing head tags we plan to replace
    html = html.replace(/<title>[\s\S]*?<\/title>/gi, "");
    html = html.replace(/<meta\s+[^>]*name=["'](?:description|keywords|twitter:card|twitter:title|twitter:description|twitter:image|author|robots)["'][^>]*>/gi, "");
    html = html.replace(/<meta\s+[^>]*property=["'](?:og:title|og:description|og:type|og:image|og:image:width|og:image:height|og:url|og:site_name|og:locale)["'][^>]*>/gi, "");
    html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, "");
    html = html.replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, "");

    const t = escapeHtml(payload.title);
    const d = escapeHtml(payload.description);
    const u = (payload.url && !payload.noCanonical && !is404) ? escapeHtml(payload.url) : null;
    const img = escapeHtml(payload.image || defaultImage);
    const ogType = escapeHtml(payload.ogType || "website");

    const canonicalTag = u ? `<link rel="canonical" href="${u}" />` : "";
    const robotsTag = is404
      ? `<meta name="robots" content="noindex, follow" />`
      : isNonIndexable
        ? `<meta name="robots" content="noindex, nofollow" />`
        : `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`;

    const injected = `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta name="author" content="${escapeHtml(authorName)}" />
    ${robotsTag}
    ${canonicalTag}

    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:type" content="${ogType}" />
    ${u ? `<meta property="og:url" content="${u}" />` : ""}
    <meta property="og:image" content="${img}" />
    <meta property="og:locale" content="en_IN" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />

    ${payload.extraHead || ""}
`;

    html = html.replace(/<\/head>/i, `${injected}\n</head>`);

    // Inject crawler-visible content inside <noscript>
    const noscriptContent = payload.richHtml || `
      <h1>${escapeHtml(payload.h1)}</h1>
      <p>${escapeHtml(payload.body)}</p>
      ${u ? `<p><a href="${u}">${escapeHtml(payload.h1)} — ${escapeHtml(siteName)}</a></p>` : ''}
    `;

    const noscriptBlock = `<noscript>${noscriptContent}</noscript>`;

    if (/<noscript>[\s\S]*?<\/noscript>/i.test(html)) {
      html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscriptBlock);
    } else {
      html = html.replace(/<body([^>]*)>/i, `<body$1>${noscriptBlock}`);
    }

    // Also populate <div id="root"> with richHtml for Wave 1 and DOM-crawlers (React will replace this upon hydration)
    if (payload.richHtml && /<div id="root">\s*<\/div>/i.test(html)) {
      html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${payload.richHtml}</div>`);
    }

    // Ensure lang="en-IN"
    html = html.replace(/<html\b[^>]*>/i, `<html lang="en-IN">`);
  } catch (err) {
    console.error("seo-handler injection failed:", err);
  }

  const httpStatus = payload.is404 ? 404 : 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (isNonIndexable) {
    res.setHeader("X-Robots-Tag", payload.is404 ? "noindex, follow" : "noindex, nofollow");
  }
  if (payload.is404) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  } else {
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400");
  }
  res.status(httpStatus).send(html);
}
