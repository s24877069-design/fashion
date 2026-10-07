// Dynamic sitemap generator for Renu Fashion Hub (Supabase-backed with backup fallback)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const baseUrl = "https://www.renufashionhub.in";
const RAW_SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_URL = RAW_SUPABASE_URL || "https://placeholder.supabase.co";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || "placeholder-key", {
  auth: { persistSession: false, autoRefreshToken: false }
});

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

function realLastmod(row) {
  const ts = row.updated_at || row.timestamp || row.created_at;
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('.')[0] + 'Z';
}

function getLocalBackup(filename) {
  try {
    const backupPath = path.join(process.cwd(), "backups", filename);
    if (fs.existsSync(backupPath)) {
      const content = fs.readFileSync(backupPath, "utf8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn(`Could not read local backup ${filename}:`, e);
  }
  return [];
}

async function fetchCollection(tableName) {
  if (SUPABASE_URL && !SUPABASE_URL.includes("placeholder") && SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_SERVICE_ROLE_KEY.includes("placeholder")) {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return data
          .filter((row) => {
            if (row.id === 999999 || row.category === "site_settings") return false;
            if (String(row.id) === "1782274718063" || row.id === 1782274718063) return false;
            if (row.title === "ggdf") return false;
            const status = (row.status || "").toLowerCase();
            if (status === "draft" || status === "pending_review" || status === "private") return false;
            return true;
          })
          .map((row) => ({
            id: String(row.id),
            lastmod: realLastmod(row),
          }));
      }
    } catch (err) {
      console.warn(`Sitemap: fetch error for ${tableName}, using backup:`, err);
    }
  }

  // Fallback to local backup
  const localData = getLocalBackup(`${tableName}.json`);
  return (localData || [])
    .filter((row) => {
      if (row.id === 999999 || row.category === "site_settings") return false;
      if (String(row.id) === "1782274718063" || row.id === 1782274718063) return false;
      if (row.title === "ggdf") return false;
      const status = (row.status || "").toLowerCase();
      if (status === "draft" || status === "pending_review" || status === "private") return false;
      return true;
    })
    .map((row) => ({
      id: String(row.id),
      lastmod: realLastmod(row),
    }));
}

function urlBlock({ loc, lastmod, changefreq, priority }) {
  const parts = [`  <url>`, `    <loc>${loc}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  parts.push(`  </url>`);
  return parts.join('\n');
}

export default async function handler(req, res) {
  try {
    const [products, posts, blogs] = await Promise.all([
      fetchCollection("products"),
      fetchCollection("posts"),
      fetchCollection("blogs"),
    ]);

    const staticPages = [
      { loc: `${baseUrl}/`, changefreq: "daily", priority: "1.0" },
      { loc: `${baseUrl}/about`, changefreq: "weekly", priority: "0.8" },
      { loc: `${baseUrl}/contact`, changefreq: "weekly", priority: "0.8" },
      { loc: `${baseUrl}/privacy-policy`, changefreq: "monthly", priority: "0.5" },
      { loc: `${baseUrl}/terms-of-service`, changefreq: "monthly", priority: "0.5" },
      { loc: `${baseUrl}/disclaimer`, changefreq: "monthly", priority: "0.5" },
      { loc: `${baseUrl}/affiliate-disclosure`, changefreq: "monthly", priority: "0.5" },
      { loc: `${baseUrl}/cookie-policy`, changefreq: "monthly", priority: "0.5" },
      { loc: `${baseUrl}/blog`, changefreq: "daily", priority: "0.9" },
      { loc: `${baseUrl}/category/sarees`, changefreq: "weekly", priority: "0.8" },
      { loc: `${baseUrl}/category/kurtas`, changefreq: "weekly", priority: "0.8" },
      { loc: `${baseUrl}/category/lehengas`, changefreq: "weekly", priority: "0.8" },
      { loc: `${baseUrl}/category/dresses`, changefreq: "weekly", priority: "0.8" },
      { loc: `${baseUrl}/category/jewelry`, changefreq: "weekly", priority: "0.8" },
    ];

    const urls = [];
    staticPages.forEach(p => urls.push(urlBlock(p)));

    products.forEach(p => urls.push(urlBlock({
      loc: `${baseUrl}/product/${escapeXml(encodeURIComponent(p.id))}`,
      lastmod: p.lastmod,
      changefreq: "weekly",
      priority: "0.8",
    })));

    posts.forEach(p => urls.push(urlBlock({
      loc: `${baseUrl}/post/${escapeXml(encodeURIComponent(p.id))}`,
      lastmod: p.lastmod,
      changefreq: "weekly",
      priority: "0.7",
    })));

    blogs.forEach(b => urls.push(urlBlock({
      loc: `${baseUrl}/blog/${escapeXml(encodeURIComponent(b.id))}`,
      lastmod: b.lastmod,
      changefreq: "weekly",
      priority: "0.8",
    })));

    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls,
      `</urlset>`,
    ].join('\n');

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=3600");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation failed:", err);
    res.status(500).send("Sitemap generation error");
  }
}
