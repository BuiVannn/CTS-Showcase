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
    tagline: {
      en: "A bite-sized Unity puzzle-platformer — playable right here.",
      vi: "Game giải đố – đi cảnh cỡ nhỏ dựng bằng Unity, chơi ngay tại đây.",
    },
    description: {
      en: "**To Your Right Places!** is a compact browser puzzle game built in Unity.\n\n- Guide each piece to its right place\n- Quick levels, easy to pick up\n\nBuilt by a CTS Lab student.",
      vi: "**To Your Right Places!** là một game giải đố gọn nhẹ trên trình duyệt, dựng bằng Unity.\n\n- Đưa từng mảnh về đúng vị trí\n- Màn chơi nhanh, dễ làm quen\n\nThực hiện bởi sinh viên CTS Lab.",
    },
    classification: "game",
    projectType: "web",
    releaseStatus: "released",
    genre: "Puzzle",
  },
];

/** Repository seam: static list today; swap to an API/DB for the full Game Hub later. */
export function getGames(): Game[] {
  return games;
}

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}
