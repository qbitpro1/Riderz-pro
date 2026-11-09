"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Image-carousel card (adapted from 21st.dev "card-22" PlaceCard).
 * Generic props instead of the original travel ones: price is a ready-formatted string, `meta`
 * replaces dateRange/hostType, `action` is a slot for the card's button, and `rating` is optional
 * (only pass a real one — the site shows no made-up ratings).
 */
export interface PlaceCardProps {
  images: { src: string; alt: string }[];
  tags?: string[];
  rating?: number;
  title: string;
  /** Short facts shown under the title, joined with bullets (e.g. duration, warranty). */
  meta?: string[];
  /** Small outlined label beside the title, e.g. "Popular". */
  badge?: string;
  description: string;
  /** Formatted price, e.g. "From ₹34,900". */
  price: string;
  /** Muted text after the price, e.g. "sedan / compact SUV". */
  priceNote?: string;
  /** The call to action (a button or link). */
  action?: React.ReactNode;
  className?: string;
}

export const PlaceCard = ({
  images,
  tags = [],
  rating,
  title,
  meta = [],
  badge,
  description,
  price,
  priceNote,
  action,
  className,
}: PlaceCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const many = images.length > 1;

  // Carousel image change handler
  const changeImage = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) return images.length - 1;
      if (nextIndex >= images.length) return 0;
      return nextIndex;
    });
  };

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Animation variants for the carousel
  const carouselVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  // Animation variants for staggering content
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  const current = images[currentIndex];

  return (
    // "user": people who ask their system for less motion get fades instead of slides and scaling.
    <MotionConfig reducedMotion="user">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        variants={contentVariants}
        whileHover={{
          scale: 1.03,
          boxShadow: "0px 18px 40px -12px rgba(0, 0, 0, 0.28)",
          transition: { type: "spring", stiffness: 300, damping: 20 },
        }}
        className={cn(
          "flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg",
          className,
        )}
      >
        {/* Image Carousel Section */}
        <div
          className="group relative h-56 shrink-0 overflow-hidden bg-muted"
          role="group"
          aria-roledescription="carousel"
          aria-label={`${title} photos`}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={currentIndex}
              src={current?.src}
              alt={current?.alt ?? title}
              loading="lazy"
              custom={direction}
              variants={carouselVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute h-full w-full object-cover"
            />
          </AnimatePresence>

          {/* Carousel Navigation: always shown on touch screens, on hover/focus elsewhere */}
          {many && (
            <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-between p-2 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="pointer-events-auto rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 hover:text-white"
                onClick={() => changeImage(-1)}
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="pointer-events-auto rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 hover:text-white"
                onClick={() => changeImage(1)}
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Top Badges and Rating */}
          {tags.length > 0 && (
            <div className="absolute left-3 top-3 z-[2] flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="border-white/40 bg-background/75 text-foreground backdrop-blur-md">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {rating !== undefined && (
            <div className="absolute right-3 top-3 z-[2]">
              <Badge variant="secondary" className="flex items-center gap-1 bg-background/75 text-foreground backdrop-blur-md">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" /> {rating}
              </Badge>
            </div>
          )}

          {/* Pagination Dots */}
          {many && (
            <div className="absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goTo(index)}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all after:absolute after:-inset-2 relative",
                    currentIndex === index ? "w-4 bg-white" : "bg-white/50 hover:bg-white/80",
                  )}
                  aria-label={`Show photo ${index + 1} of ${images.length}`}
                  aria-current={currentIndex === index || undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <motion.div variants={contentVariants} className="flex flex-1 flex-col gap-3 p-5">
          <motion.div variants={itemVariants} className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold leading-snug tracking-[-0.01em]">{title}</h3>
            {badge && (
              <Badge variant="outline" className="shrink-0 border-border">
                {badge}
              </Badge>
            )}
          </motion.div>

          {meta.length > 0 && (
            <motion.p variants={itemVariants} className="text-sm text-muted-foreground">
              {meta.map((m, i) => (
                <React.Fragment key={m}>
                  {i > 0 && <span aria-hidden="true"> &bull; </span>}
                  <span>{m}</span>
                </React.Fragment>
              ))}
            </motion.p>
          )}

          <motion.p variants={itemVariants} className="flex-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap items-end justify-between gap-3 pt-2">
            <p className="font-semibold tabular-nums">
              {price}
              {priceNote && <span className="block text-xs font-normal text-muted-foreground">{priceNote}</span>}
            </p>
            {action}
          </motion.div>
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
};

export default PlaceCard;
