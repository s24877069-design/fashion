import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Search, 
  Share2, 
  Menu, 
  X, 
  Phone, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  ExternalLink,
  Instagram,
  Youtube,
  Facebook,
  Lock,
  UserCheck,
  Tag
} from "lucide-react";
import { SimpleThemeToggle } from "../theme";

interface HeaderProps {
  profileName: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleNavigate: (path: string) => void;
  onOpenShareModal: () => void;
  isAdminUser?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profileName,
  searchQuery,
  setSearchQuery,
  handleNavigate,
  onOpenShareModal,
  isAdminUser
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Lock background body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const categories = [
    { label: "Sarees", href: "/category/sarees", count: "80+" },
    { label: "Kurtis & Suits", href: "/category/kurtas", count: "70+" },
    { label: "Lehengas", href: "/category/lehengas", count: "45+" },
    { label: "Dresses", href: "/category/dresses", count: "50+" },
    { label: "Jewellery", href: "/category/jewelry", count: "60+" }
  ];

  const editorialPages = [
    { label: "Fashion Blog & Lookbooks", href: "/blog" },
    { label: "About Curator Renu", href: "/about" },
    { label: "Contact & Styling Inquiries", href: "/contact" }
  ];

  const desktopNavLinks = [
    { label: "Home", href: "/" },
    ...categories,
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" }
  ];

  return (
    <header className="w-full relative z-40">
      {/* Top Luxury Announcement Bar (Hidden on mobile to save vertical space) */}
      <div className="hidden sm:block w-full bg-stone-900 dark:bg-black text-stone-200 text-[11px] py-1.5 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium tracking-wide">
              Curated Indian Haute Couture & Styling Guides by Renu Agarwal · Verified Boutique Links
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-stone-400 shrink-0">
            <a 
              href="https://wa.me/917248763036" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-rose-400 transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>Personal Style Assist: +91 72487 63036</span>
            </a>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>100% Genuine Curations</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Luxury Navigation Bar (Compact h-16 on mobile, h-20 on desktop) */}
      <nav 
        className="w-full bg-[#FAF9F6]/95 dark:bg-[#0C0A09]/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-colors duration-200"
        aria-label="Main Navigation"
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-1 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link 
              to="/" 
              onClick={(e) => {
                e.preventDefault();
                handleNavigate("/");
              }}
              className="flex flex-col group text-inherit no-underline truncate"
            >
              <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                RENU FASHION HUB
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-[0.25em] text-rose-600 dark:text-rose-400 font-bold -mt-0.5 truncate">
                HAUTE COUTURE & STYLING
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links (SSR crawlable <a href>) */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-7">
            {desktopNavLinks.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(item.href);
                  }}
                  className={`text-xs font-semibold uppercase tracking-wider transition-colors relative py-1 ${
                    isActive 
                      ? "text-rose-600 dark:text-rose-400 font-bold" 
                      : "text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose-600 dark:bg-rose-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions Cluster (Search, Theme Toggle, Share, Admin) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/60 transition-colors flex items-center justify-center active:scale-95 cursor-pointer shadow-xs"
              aria-label="Toggle search"
              title="Search Styles"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Simple, Lag-Free Theme Toggle */}
            <SimpleThemeToggle />

            {/* Share Button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/60 transition-colors flex items-center justify-center active:scale-95 cursor-pointer shadow-xs"
              aria-label="Share Renu Fashion Hub"
              title="Share Page"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Mobile Search Bar (Opens smoothly without cramping header actions) */}
        {isSearchOpen && (
          <div className="w-full px-4 py-2.5 bg-stone-100 dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-800">
            <div className="max-w-2xl mx-auto flex items-center gap-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-full px-3.5 py-1.5 shadow-sm">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Banarasi sarees, bridal lehengas, kurtis..."
                className="w-full bg-transparent text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 shrink-0 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0 pl-1"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Full-Featured Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 top-16 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
            />

            {/* Drawer Content */}
            <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-[#FAF9F6] dark:bg-[#0C0A09] border-t border-stone-200 dark:border-stone-800 overflow-y-auto px-5 py-6 space-y-6 shadow-2xl">
              
              {/* Category Silhouettes */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  <span>Curated Silhouettes</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isActive = location.pathname === cat.href;
                    return (
                      <Link
                        key={cat.href}
                        to={cat.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigate(cat.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all min-h-[44px] ${
                          isActive 
                            ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 shadow-xs" 
                            : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-rose-300"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="text-[9px] text-stone-400 font-mono font-medium">{cat.count}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Editorial Guides & Company Links */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-2">
                  Editorial & Guidance
                </p>
                <div className="space-y-1 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-2 shadow-xs">
                  {editorialPages.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigate(item.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
                          isActive 
                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold" 
                            : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-4 h-4 opacity-40" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Direct Personal Styling Chat Button */}
              <a
                href="https://wa.me/917248763036"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm min-h-[48px]"
              >
                <Phone className="w-4 h-4" />
                <span>Chat Direct on WhatsApp (+91 72487 63036)</span>
              </a>

              {/* Social Channels */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-center gap-3">
                <a
                  href="https://www.instagram.com/renu_agarwal_vlogs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-pink-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com/@renuagarwalvlogs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://www.facebook.com/share/17YfgJkGda/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-blue-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>

            </div>
          </>
        )}
      </nav>
    </header>
  );
};
