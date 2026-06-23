import type { Game } from "./types";

const games: Game[] = [
  {
    id: "tyrp",
    slug: "tyrp",
    title: "To Your Right Places!",
    author: "KillDee8",
    year: 2024,
    embedPath: "/games/tyrp/index.html",
    tags: ["Unity", "WebGL"],
    blurb: {
      en: "A browser game built in Unity — play it right here.",
      vi: "Một game trên trình duyệt dựng bằng Unity — chơi ngay tại đây.",
    },
  },
];

/** Repository seam: static list today; swap to an API/DB for the full Game Hub later. */
export function getGames(): Game[] {
  return games;
}

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}
