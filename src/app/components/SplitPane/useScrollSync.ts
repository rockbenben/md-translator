"use client";

import { useRef, useEffect, useCallback, RefObject } from "react";

/**
 * Scroll sync options
 */
export interface UseScrollSyncOptions {
  /** Whether scroll sync is enabled */
  enabled?: boolean;
  /** Sync strategy: 'index' uses data-index attributes, 'percentage' uses scroll percentage */
  strategy?: "index" | "percentage";
}

/**
 * Scroll sync return type
 */
export interface UseScrollSyncReturn {
  /** Ref for the left panel scroll container */
  leftScrollRef: RefObject<HTMLElement | null>;
  /** Ref for the right panel scroll container */
  rightScrollRef: RefObject<HTMLElement | null>;
  /** Manually sync scroll from left to right */
  syncLeftToRight: () => void;
  /** Manually sync scroll from right to left */
  syncRightToLeft: () => void;
}

/**
 * Hook for bidirectional scroll synchronization between two panels
 *
 * Features:
 * - Bidirectional sync: scroll either panel to sync the other
 * - isScrolling flag prevents infinite scroll loops
 * - RAF batching for smooth 60fps performance
 * - data-index attribute matching for precise row-level sync
 * - Percentage fallback for plain textareas
 * - Refs (not state) for DOM manipulation to avoid re-renders
 */
export function useScrollSync(options: UseScrollSyncOptions = {}): UseScrollSyncReturn {
  const { enabled = true, strategy = "index" } = options;

  // Refs for scroll containers
  const leftScrollRef = useRef<HTMLElement | null>(null);
  const rightScrollRef = useRef<HTMLElement | null>(null);

  // Ref for isScrolling flag - prevents bidirectional feedback loops
  const isScrollingRef = useRef(false);

  // Ref for RAF handle - enables canceling pending frame updates
  const rafHandleRef = useRef<number | null>(null);

  /**
   * Find the best matching element with data-index in the target container
   * based on the source element's data-index
   */
  const findTargetElement = useCallback(
    (sourceElement: Element | null, targetContainer: HTMLElement | null): HTMLElement | null => {
      if (!sourceElement || !targetContainer) return null;

      const sourceIndex = sourceElement.getAttribute("data-index");
      if (!sourceIndex) return null;

      // Find matching element in target container by data-index
      return targetContainer.querySelector(`[data-index="${sourceIndex}"]`);
    },
    []
  );

  /**
   * Get the first visible element with data-index in a container
   */
  const getFirstVisibleElement = useCallback(
    (container: HTMLElement | null): HTMLElement | null => {
      if (!container) return null;

      const elements = container.querySelectorAll("[data-index]");
      const containerRect = container.getBoundingClientRect();

      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        // Check if element is visible (within container bounds)
        if (rect.top >= containerRect.top && rect.top < containerRect.bottom) {
          return element as HTMLElement;
        }
      }

      return null;
    },
    []
  );

  /**
   * Check if container has data-index elements (for markdown content)
   */
  const hasDataIndexElements = useCallback((container: HTMLElement | null): boolean => {
    if (!container) return false;
    return container.querySelectorAll("[data-index]").length > 0;
  }, []);

  /**
   * Scroll target container using percentage-based sync
   * Works for both divs and textareas
   */
  const scrollToPercentage = useCallback(
    (sourceContainer: HTMLElement | null, targetContainer: HTMLElement | null) => {
      if (!sourceContainer || !targetContainer || !enabled) return;

      // Calculate scroll percentage in source
      const sourceScrollableHeight = sourceContainer.scrollHeight - sourceContainer.clientHeight;
      const scrollPercentage = sourceScrollableHeight > 0 
        ? sourceContainer.scrollTop / sourceScrollableHeight 
        : 0;

      // Apply same percentage to target
      const targetScrollableHeight = targetContainer.scrollHeight - targetContainer.clientHeight;
      const targetScrollTop = scrollPercentage * targetScrollableHeight;

      targetContainer.scrollTop = targetScrollTop;
    },
    [enabled]
  );

  /**
   * Scroll target container to match source element's position
   * Uses data-index for precise row-level sync when available
   * Falls back to percentage-based sync for plain content (like textarea)
   */
  const scrollToMatchingIndex = useCallback(
    (sourceContainer: HTMLElement | null, targetContainer: HTMLElement | null) => {
      if (!sourceContainer || !targetContainer || !enabled) return;

      // If source container has data-index elements (markdown preview), use precise sync
      if (hasDataIndexElements(sourceContainer)) {
        const firstVisibleElement = getFirstVisibleElement(sourceContainer);
        const targetElement = findTargetElement(firstVisibleElement, targetContainer);

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "instant", block: "start" });
          return;
        }
      }

      // Fall back to percentage-based sync for plain textareas
      scrollToPercentage(sourceContainer, targetContainer);
    },
    [enabled, getFirstVisibleElement, findTargetElement, hasDataIndexElements, scrollToPercentage]
  );

  /**
   * Sync scroll from left to right panel
   */
  const syncLeftToRight = useCallback(() => {
    if (!enabled) return;

    const leftContainer = leftScrollRef.current;
    const rightContainer = rightScrollRef.current;

    if (strategy === "index") {
      scrollToMatchingIndex(leftContainer, rightContainer);
    } else {
      scrollToPercentage(leftContainer, rightContainer);
    }
  }, [enabled, strategy, scrollToMatchingIndex, scrollToPercentage]);

  /**
   * Sync scroll from right to left panel
   */
  const syncRightToLeft = useCallback(() => {
    if (!enabled) return;

    const leftContainer = leftScrollRef.current;
    const rightContainer = rightScrollRef.current;

    if (strategy === "index") {
      scrollToMatchingIndex(rightContainer, leftContainer);
    } else {
      scrollToPercentage(rightContainer, leftContainer);
    }
  }, [enabled, strategy, scrollToMatchingIndex, scrollToPercentage]);

  /**
   * Handle scroll event with RAF batching and isScrolling flag
   */
  const handleScroll = useCallback(
    (source: "left" | "right") => {
      // If already scrolling, don't trigger again (prevents infinite loops)
      if (isScrollingRef.current || !enabled) return;

      // Cancel any pending RAF
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
      }

      // Schedule the sync in the next RAF
      rafHandleRef.current = requestAnimationFrame(() => {
        // Set isScrolling flag to prevent bidirectional feedback
        isScrollingRef.current = true;

        try {
          if (source === "left") {
            syncLeftToRight();
          } else {
            syncRightToLeft();
          }
        } finally {
          // Reset isScrolling flag after a small delay to allow for quick back-and-forth
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 50);
        }
      });
    },
    [enabled, syncLeftToRight, syncRightToLeft]
  );

  // Set up scroll event listeners
  useEffect(() => {
    const leftContainer = leftScrollRef.current;
    const rightContainer = rightScrollRef.current;

    if (!leftContainer || !rightContainer || !enabled) return;

    const leftHandler = () => handleScroll("left");
    const rightHandler = () => handleScroll("right");

    leftContainer.addEventListener("scroll", leftHandler, { passive: true });
    rightContainer.addEventListener("scroll", rightHandler, { passive: true });

    return () => {
      leftContainer.removeEventListener("scroll", leftHandler);
      rightContainer.removeEventListener("scroll", rightHandler);

      // Cancel any pending RAF on cleanup
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
      }
    };
  }, [enabled, handleScroll]);

  return {
    leftScrollRef,
    rightScrollRef,
    syncLeftToRight,
    syncRightToLeft,
  };
}

export default useScrollSync;
