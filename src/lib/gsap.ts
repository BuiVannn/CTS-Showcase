"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { CustomWiggle } from "gsap/CustomWiggle";
import { CustomBounce } from "gsap/CustomBounce";

// Register GSAP plugins once at module level
if (typeof window !== "undefined") {
  gsap.registerPlugin(
    ScrollTrigger,
    ScrollToPlugin,
    SplitText,
    CustomEase,
    CustomWiggle,
    CustomBounce
  );
}

// Default GSAP configuration
gsap.defaults({
  ease: "power3.out",
  duration: 0.8,
});

// ScrollTrigger defaults
ScrollTrigger.defaults({
  toggleActions: "play none none reverse",
});

// Custom easing presets for experimental animations
export const experimentalEases = {
  elasticBounce: "elastic.out(1, 0.3)",
  springSmooth: "back.out(1.7)",
  physicsDecel: "power4.out",
  bounceIn: "bounce.out",
  magneticReturn: "elastic.out(1, 0.4)",
};

export {
  gsap,
  ScrollTrigger,
  ScrollToPlugin,
  SplitText,
  CustomEase,
  CustomWiggle,
  CustomBounce,
};
