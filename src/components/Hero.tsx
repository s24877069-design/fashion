import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  ChevronUp, 
  ChevronDown,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeroProps {
  handleNavigate: (path: string) => void;
  posts?: any[];
  featuredProduct?: any;
  profileAvatar?: string;
  profileName?: string;
}

// Strictly identify video/reel posts to exclude them from the image post viewer
export const isVideoPost = (post: any): boolean => {
  if (!post) return true;
  const type = String(post.type || "").toLowerCase().trim();
  if (type === "video" || type === "reel" || type === "shorts") return true;
  if (post.media_type === "video") return true;

  const url = String(post.url || "").toLowerCase();
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("/shorts/") ||
    url.includes("vimeo.com") ||
    url.includes(".mp4") ||
    url.includes(".webm") ||
    url.includes(".mov") ||
    (url.includes("facebook.com") && (url.includes("/videos/") || url.includes("/watch/")))
  );
};

// Only include genuine published photo/image posts
export const isEligibleImagePost = (post: any): boolean => {
  if (!post) return false;
  if (post.status === "draft" || post.status === "unpublished" || post.status === "pending_review" || post.isPrivate) {
    return false;
  }
  if (isVideoPost(post)) return false;
  const url = String(post.url || post.image_url || "").toLowerCase();
  if (!url) return false;
  // Must have an image extension or non-video image source
  return true;
};

export const Hero: React.FC<HeroProps> = ({
  handleNavigate,
  posts = [],
  featuredProduct,
  profileAvatar,
  profileName = "Renu Agarwal"
}) => {
  // 1. Filter genuine eligible photo posts (no videos/reels)
  const eligiblePosts = useMemo(() => {
    return (posts || []).filter(isEligibleImagePost);
  }, [posts]);

  const hasEligiblePosts = eligiblePosts.length > 0;
  const hasMultiplePosts = eligiblePosts.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isWheeling = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Keep index within bounds if post count changes
  useEffect(() => {
    if (eligiblePosts.length > 0 && currentIndex >= eligiblePosts.length) {
      setCurrentIndex(Math.max(0, eligiblePosts.length - 1));
    }
  }, [eligiblePosts.length, currentIndex]);

  const goToNext = useCallback(() => {
    if (!hasMultiplePosts) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % eligiblePosts.length);
  }, [hasMultiplePosts, eligiblePosts.length]);

  const goToPrev = useCallback(() => {
    if (!hasMultiplePosts) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + eligiblePosts.length) % eligiblePosts.length);
  }, [hasMultiplePosts, eligiblePosts.length]);

  // Desktop Mouse Wheel Interaction (Only active when real multiple posts exist)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!hasMultiplePosts) return;
    if (isWheeling.current) return;

    const deltaY = e.deltaY;
    if (Math.abs(deltaY) < 18) return;

    // Check boundaries: if at start and scrolling up, or at end and scrolling down, allow normal page scroll
    const atStart = currentIndex === 0 && deltaY < 0;
    const atEnd = currentIndex === eligiblePosts.length - 1 && deltaY > 0;
    if (atStart || atEnd) {
      return; // Do not block, allow normal page scroll
    }

    // Otherwise consume the tick and smoothly transition to next/prev post
    isWheeling.current = true;
    if (deltaY > 0) {
      goToNext();
    } else {
      goToPrev();
    }

    setTimeout(() => {
      isWheeling.current = false;
    }, 280);
  }, [hasMultiplePosts, currentIndex, eligiblePosts.length, goToNext, goToPrev]);

  // Mobile Touch Swipe Handling (Only active when real multiple posts exist)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultiplePosts) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultiplePosts) return;
    if (touchStartY.current === null || touchStartX.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const diffY = touchEndY - touchStartY.current;
    const diffX = touchEndX - touchStartX.current;

    // Trigger on clear vertical swipe (greater than horizontal movement and > 38px)
    if (Math.abs(diffY) > 38 && Math.abs(diffY) > Math.abs(diffX)) {
      if (diffY < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    touchStartY.current = null;
    touchStartX.current = null;
  };

  // Determine current display data:
  // If real image posts exist: use current post
  // If zero image posts exist: use authentic featured product from catalogue (NEVER a fake/unrelated fallback image)
  const currentPost = hasEligiblePosts ? eligiblePosts[currentIndex] : null;

  const displayImageUrl = hasEligiblePosts
    ? (currentPost?.url || currentPost?.image_url || "")
    : (featuredProduct?.url || "");

  const displayTitle = hasEligiblePosts
    ? (currentPost?.name || currentPost?.title || currentPost?.caption || "Curated Indian Style")
    : (featuredProduct?.name || "Handcrafted Kanjivaram Silk Saree");

  const displayCategory = hasEligiblePosts
    ? (currentPost?.category || "Photo Gallery")
    : (featuredProduct?.category ? (featuredProduct.category.charAt(0).toUpperCase() + featuredProduct.category.slice(1)) : "Curator's Showcase");

  // Reset imageLoaded on image URL change to ensure seamless fade-in
  useEffect(() => {
    setImageLoaded(false);
  }, [displayImageUrl]);

  return (
    <section className="relative overflow-hidden pt-4 pb-10 sm:pt-10 sm:pb-16 md:pt-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 md:space-y-8">
            {/* Editorial Kicker */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500" />
              <span>Spring / Festive 2026 Haute Couture</span>
            </div>

            {/* Main Display Headline (compact, responsive typography) */}
            <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 dark:text-stone-50 leading-[1.15] sm:leading-[1.12]">
              The Art of Indian Elegance, <span className="italic font-normal text-rose-600 dark:text-rose-400">Handpicked</span> for You.
            </h1>

            {/* Subtext */}
            <p className="text-xs sm:text-sm md:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
              Curated by fashion stylist and creator <strong className="text-stone-900 dark:text-stone-100 font-bold">{profileName}</strong>. 
              Discover handcrafted Banarasi sarees, embroidered festive kurtis, bridal lehengas, and heirloom jewellery — paired with authentic reviews and direct verified boutique links.
            </p>

            {/* Call to Actions (Touch-friendly 44px+ on mobile) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 pt-1 sm:pt-2">
              <a
                href="#collections-grid"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("collections-grid")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto px-6 py-3 sm:py-3.5 min-h-[44px] rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer text-center"
              >
                <span>Explore Curated Styles</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>

              <Link
                to="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate("/blog");
                }}
                className="w-full sm:w-auto px-6 py-3 sm:py-3.5 min-h-[44px] rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 text-center flex items-center justify-center"
              >
                Read Styling Guides
              </Link>
            </div>

            {/* Stylist Curator Byline & Trust Pillars */}
            <div className="pt-3 sm:pt-4 border-t border-stone-200/80 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {profileAvatar && (
                  <img 
                    src={profileAvatar} 
                    alt={profileName} 
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-rose-500 shadow-sm shrink-0"
                  />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{profileName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                    Verified Fashion Creator & Stylist
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>4.9 / 5.0 Styling Trust</span>
                </span>
                <span className="opacity-30">·</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Store Links</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Card (Interactive Multi-Post Viewer if eligible posts exist, Clean Editorial Showcase if zero) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              
              {/* Decorative luxury frame backdrop */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-transparent rounded-[2.5rem] blur-xl opacity-70 pointer-events-none" />

              {/* Main Card Viewport */}
              <div 
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative rounded-[2rem] overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl select-none group"
              >
                {/* Fixed Controlled Aspect Ratio (4:5) */}
                <div className="aspect-[4/5] relative overflow-hidden bg-stone-900">
                  
                  {/* Luxury Loading Shimmer Base (Visible while image is loading or URL is resolving) */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-stone-800/80 border border-amber-500/30 flex items-center justify-center mb-3 shadow-lg shadow-black/50">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest mb-1">
                      Curator's Haute Pick
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Loading handpicked luxury style...
                    </span>
                  </div>

                  {/* Virtualized Animated Post Slide when multi-posts exist, clean static slide for showcase */}
                  {displayImageUrl ? (
                    hasMultiplePosts ? (
                      <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                          key={currentPost?.id || currentIndex}
                          custom={direction}
                          initial={{ 
                            opacity: 0, 
                            y: direction > 0 ? 28 : -28,
                            scale: 0.985 
                          }}
                          animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1, 
                            transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } 
                          }}
                          exit={{ 
                            opacity: 0, 
                            y: direction > 0 ? -28 : 28,
                            scale: 0.985,
                            transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } 
                          }}
                          className="absolute inset-0 w-full h-full will-change-transform z-10"
                        >
                          <img
                            src={displayImageUrl}
                            alt={displayTitle}
                            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-103 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                            loading="eager"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onLoad={() => setImageLoaded(true)}
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                            }}
                          />
                        </motion.div>
                      </AnimatePresence>
                    ) : (
                      <div className="absolute inset-0 w-full h-full z-10">
                        <img
                          src={displayImageUrl}
                          alt={displayTitle}
                          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-103 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                          loading="eager"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onLoad={() => setImageLoaded(true)}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                    )
                  ) : null}

                  {/* Gradient Scrim for Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-stone-950/30 pointer-events-none z-15" />

                  {/* Top Bar: Curator Badge (+ Dynamic Indicator ONLY when real multiple posts exist) */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-none z-20">
                    <div className="px-2.5 py-1 sm:px-3 rounded-full bg-stone-900/85 backdrop-blur-md text-amber-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1.5 shadow-md">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{hasEligiblePosts ? "Curator's Lookbook" : "Curator's Showcase"}</span>
                    </div>

                    {/* Minimal Dynamic Post Indicator: ONLY SHOWN IF REAL MULTIPLE POSTS EXIST (No fake 01 / 01) */}
                    {hasMultiplePosts && (
                      <div className="px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-stone-200 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest border border-white/10 shadow-md flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>{String(currentIndex + 1).padStart(2, "0")}</span>
                        <span className="opacity-30">/</span>
                        <span className="opacity-60">{String(eligiblePosts.length).padStart(2, "0")}</span>
                      </div>
                    )}
                  </div>

                  {/* Right-Side Subtle Vertical Navigation Arrows: ONLY SHOWN IF MULTIPLE POSTS EXIST (No fake arrows) */}
                  {hasMultiplePosts && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 opacity-85 hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={goToPrev}
                        aria-label="Previous post"
                        className="p-1.5 sm:p-2 rounded-full bg-stone-900/75 hover:bg-stone-900 backdrop-blur-md text-stone-200 hover:text-white border border-white/15 transition-all active:scale-90 cursor-pointer shadow-lg"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNext}
                        aria-label="Next post"
                        className="p-1.5 sm:p-2 rounded-full bg-stone-900/75 hover:bg-stone-900 backdrop-blur-md text-stone-200 hover:text-white border border-white/15 transition-all active:scale-90 cursor-pointer shadow-lg"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Bottom Editorial Content Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/92 dark:bg-stone-900/92 backdrop-blur-md border border-white/50 dark:border-stone-800 shadow-xl">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                          {displayCategory}
                        </p>
                        {hasMultiplePosts && (
                          <span className="text-[9px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                            Scroll / Swipe
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate mb-2">
                        {displayTitle}
                      </h3>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800/80">
                        <span className="text-[9px] sm:text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                          Curated Indian Fashion
                        </span>

                        {/* Semantic Link: Real /post/:id if real post exists, or explore collection if showcase */}
                        {hasEligiblePosts && currentPost?.id ? (
                          <a
                            href={`/post/${currentPost.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigate(`/post/${currentPost.id}`);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 group/btn"
                          >
                            <span>Explore Post</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                          </a>
                        ) : featuredProduct?.id ? (
                          <a
                            href={`/product/${featuredProduct.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigate(`/product/${featuredProduct.id}`);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 group/btn"
                          >
                            <span>Explore Piece</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                          </a>
                        ) : (
                          <a
                            href="#collections-grid"
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById("collections-grid")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 group/btn"
                          >
                            <span>View Collection</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
