"use client";

import { gsap } from "@/lib/gsap";

/**
 * Experimental Animation Utilities
 * Reusable GSAP animation functions for buttons and frames
 */

// Custom easing curves for experimental effects
export const customEases = {
  // Elastic bounce for playful interactions
  elasticBounce: "elastic.out(1, 0.3)",
  // Smooth spring for natural feel
  springSmooth: "back.out(1.7)",
  // Physics-based deceleration
  physicsDecel: "power4.out",
  // Bouncy entrance
  bounceIn: "bounce.out",
  // Smooth magnetic return
  magneticReturn: "elastic.out(1, 0.4)",
};

/**
 * Physics-based magnetic hover effect
 * Stronger than the standard magnetic button effect
 */
export function createPhysicsMagneticEffect(
  element: HTMLElement,
  options: {
    strength?: number;
    scale?: number;
    rotation?: number;
    duration?: number;
  } = {}
) {
  const {
    strength = 0.4,
    scale = 1.1,
    rotation = 2,
    duration = 0.5,
  } = options;

  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * rotation;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * -rotation;

    gsap.to(element, {
      x: deltaX,
      y: deltaY,
      scale,
      rotateX,
      rotateY,
      duration,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      duration: 0.8,
      ease: customEases.magneticReturn,
    });
  };

  element.addEventListener("mousemove", handleMouseMove);
  element.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    element.removeEventListener("mousemove", handleMouseMove);
    element.removeEventListener("mouseleave", handleMouseLeave);
  };
}

/**
 * Cursor-following glow effect
 * Creates a subtle glow that follows the mouse cursor
 */
export function createCursorGlowEffect(
  element: HTMLElement,
  options: {
    color?: string;
    size?: number;
    intensity?: number;
  } = {}
) {
  const { color = "rgba(220, 38, 38, 0.3)", size = 100, intensity = 0.5 } = options;

  const glowElement = document.createElement("div");
  glowElement.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: radial-gradient(circle, ${color} 0%, transparent 70%);
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, -50%);
    z-index: -1;
    transition: opacity 0.3s ease;
  `;

  element.style.position = "relative";
  element.appendChild(glowElement);

  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(glowElement, {
      x,
      y,
      opacity: intensity,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(glowElement, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  element.addEventListener("mousemove", handleMouseMove);
  element.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    element.removeEventListener("mousemove", handleMouseMove);
    element.removeEventListener("mouseleave", handleMouseLeave);
    element.removeChild(glowElement);
  };
}

/**
 * Experimental button press animation
 * Physics-based spring animation with bounce
 */
export function createExperimentalPressAnimation(
  element: HTMLElement,
  options: {
    scale?: number;
    duration?: number;
    bounce?: number;
  } = {}
) {
  const { scale = 0.95, duration = 0.3, bounce = 1.5 } = options;

  const handleMouseDown = () => {
    gsap.to(element, {
      scale,
      duration: duration * 0.5,
      ease: "power2.in",
    });
  };

  const handleMouseUp = () => {
    gsap.to(element, {
      scale: 1,
      duration,
      ease: `back.out(${bounce})`,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      scale: 1,
      duration: 0.5,
      ease: customEases.elasticBounce,
    });
  };

  element.addEventListener("mousedown", handleMouseDown);
  element.addEventListener("mouseup", handleMouseUp);
  element.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    element.removeEventListener("mousedown", handleMouseDown);
    element.removeEventListener("mouseup", handleMouseUp);
    element.removeEventListener("mouseleave", handleMouseLeave);
  };
}

/**
 * Experimental ripple effect with custom wave pattern
 */
export function createExperimentalRippleEffect(
  element: HTMLElement,
  options: {
    color?: string;
    duration?: number;
    waves?: number;
  } = {}
) {
  const { color = "rgba(255, 255, 255, 0.3)", duration = 0.8, waves = 3 } = options;

  const handleClick = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < waves; i++) {
      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${color};
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%) scale(0);
        pointer-events: none;
        z-index: 10;
      `;

      element.appendChild(ripple);

      gsap.to(ripple, {
        scale: 10 + i * 5,
        opacity: 0,
        duration: duration + i * 0.1,
        delay: i * 0.05,
        ease: "power2.out",
        onComplete: () => {
          if (element.contains(ripple)) {
            element.removeChild(ripple);
          }
        },
      });
    }
  };

  element.addEventListener("click", handleClick);

  return () => {
    element.removeEventListener("click", handleClick);
  };
}

/**
 * Frame entrance animation with morphing border effect
 */
export function createMorphingBorderAnimation(
  element: HTMLElement,
  options: {
    duration?: number;
    delay?: number;
    color?: string;
  } = {}
) {
  const { duration = 1, delay = 0, color = "#dc2626" } = options;

  // Create border overlay
  const borderOverlay = document.createElement("div");
  borderOverlay.style.cssText = `
    position: absolute;
    inset: 0;
    border: 2px solid ${color};
    border-radius: inherit;
    opacity: 0;
    transform: scale(0.95);
    pointer-events: none;
    z-index: 10;
  `;

  element.style.position = "relative";
  element.appendChild(borderOverlay);

  // Animate border appearance
  gsap.fromTo(
    borderOverlay,
    { opacity: 0, scale: 0.95 },
    {
      opacity: 1,
      scale: 1,
      duration,
      delay,
      ease: customEases.springSmooth,
    }
  );

  // Animate border morphing
  gsap.to(borderOverlay, {
    borderRadius: "20px",
    duration: duration * 0.5,
    delay: delay + duration * 0.5,
    ease: "power2.inOut",
    yoyo: true,
    repeat: 1,
  });

  return () => {
    if (element.contains(borderOverlay)) {
      element.removeChild(borderOverlay);
    }
  };
}

/**
 * Perspective tilt reveal animation for frames
 */
export function createPerspectiveTiltReveal(
  element: HTMLElement,
  options: {
    duration?: number;
    delay?: number;
    tilt?: number;
  } = {}
) {
  const { duration = 1, delay = 0, tilt = 10 } = options;

  gsap.fromTo(
    element,
    {
      opacity: 0,
      rotateX: tilt,
      transformPerspective: 1000,
      transformOrigin: "center bottom",
    },
    {
      opacity: 1,
      rotateX: 0,
      duration,
      delay,
      ease: customEases.elasticBounce,
    }
  );
}

/**
 * Diagonal wipe reveal animation
 */
export function createDiagonalWipeReveal(
  element: HTMLElement,
  options: {
    duration?: number;
    delay?: number;
    direction?: "left" | "right";
  } = {}
) {
  const { duration = 1, delay = 0, direction = "left" } = options;

  const clipPath =
    direction === "left"
      ? "polygon(0 0, 0 0, 0 100%, 0 100%)"
      : "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)";

  const finalClipPath = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";

  gsap.fromTo(
    element,
    { clipPath, opacity: 0 },
    {
      clipPath: finalClipPath,
      opacity: 1,
      duration,
      delay,
      ease: customEases.physicsDecel,
    }
  );
}

/**
 * Grid cell reveal animation for product cards
 */
export function createGridCellReveal(
  elements: HTMLElement[],
  options: {
    duration?: number;
    stagger?: number;
    delay?: number;
  } = {}
) {
  const { duration = 0.8, stagger = 0.1, delay = 0 } = options;

  gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: 40,
      scale: 0.9,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration,
      stagger,
      delay,
      ease: customEases.springSmooth,
    }
  );
}

/**
 * Card flip entrance animation
 */
export function createCardFlipEntrance(
  element: HTMLElement,
  options: {
    duration?: number;
    delay?: number;
    direction?: "x" | "y";
  } = {}
) {
  const { duration = 1, delay = 0, direction = "y" } = options;

  const rotation = direction === "y" ? "rotateY" : "rotateX";

  gsap.fromTo(
    element,
    {
      opacity: 0,
      [rotation]: 90,
      transformPerspective: 1000,
      transformOrigin: "center center",
    },
    {
      opacity: 1,
      [rotation]: 0,
      duration,
      delay,
      ease: customEases.elasticBounce,
    }
  );
}

/**
 * Wave reveal animation for multiple elements
 */
export function createWaveReveal(
  elements: HTMLElement[],
  options: {
    duration?: number;
    stagger?: number;
    delay?: number;
    direction?: "up" | "down";
  } = {}
) {
  const { duration = 0.6, stagger = 0.08, delay = 0, direction = "up" } = options;

  const yOffset = direction === "up" ? 30 : -30;

  gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: yOffset,
    },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      delay,
      ease: customEases.elasticBounce,
    }
  );
}

/**
 * Frame hover micro-interaction
 * Subtle border glow and shadow depth change
 */
export function createFrameHoverEffect(
  element: HTMLElement,
  options: {
    glowColor?: string;
    shadowIntensity?: number;
    scale?: number;
  } = {}
) {
  const { glowColor = "rgba(220, 38, 38, 0.2)", shadowIntensity = 0.1, scale = 1.02 } = options;

  const handleMouseEnter = () => {
    gsap.to(element, {
      boxShadow: `0 10px 40px rgba(0, 0, 0, ${shadowIntensity}), 0 0 20px ${glowColor}`,
      scale,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      scale: 1,
      duration: 0.6,
      ease: customEases.magneticReturn,
    });
  };

  element.addEventListener("mouseenter", handleMouseEnter);
  element.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    element.removeEventListener("mouseenter", handleMouseEnter);
    element.removeEventListener("mouseleave", handleMouseLeave);
  };
}

/**
 * Reduced motion support
 * Returns true if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * Get animation ease based on reduced motion preference
 */
export function getAnimationEase(ease: string): string {
  return prefersReducedMotion() ? "none" : ease;
}
