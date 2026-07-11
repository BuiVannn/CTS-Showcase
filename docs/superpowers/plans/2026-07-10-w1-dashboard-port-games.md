# W1 — Port dữ liệu + Adapter local (Games) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa **toàn bộ đường đọc dữ liệu game** của website đi qua một lớp port có hợp đồng cố định, với adapter `local` (nguồn hiện tại), **không đổi một chút hành vi nào** — để lát sau chỉ cần thêm adapter `dashboard` là xong.

**Architecture:** UI → `game-catalog.ts` (giữ nguyên tên hàm) → `src/lib/dashboard/` (port) → `adapters/local.ts` (SQLite + content tĩnh). DTO trung lập (`UserGame`, `CatalogGame`) là ranh giới: adapter nào cũng phải quy dữ liệu về đúng shape đó. Một **bộ test hợp đồng** (contract suite) khoá hành vi lại — adapter `dashboard` sau này bắt buộc phải qua đúng bộ đó.

**Tech Stack:** Next.js 16 (App Router, server components), TypeScript strict, vitest, better-sqlite3 (tạm thời, gỡ ở W5).

**Spec:** `docs/superpowers/specs/2026-07-10-web-dashboard-integration-design.md` (§2, §3.2, §11, §12, §13)

## Global Constraints

- ⚠️ **`AGENTS.md` của repo:** "This is NOT the Next.js you know." Trước khi viết code dính tới Next (server component, async page, `dynamic`, caching), **đọc `node_modules/next/dist/docs/`** — API có thể khác với thứ bạn nhớ.
- **Không thêm dependency mới.** Không thêm zod, không thêm thư viện markdown.
- **W1 là refactor thuần: hành vi người dùng phải y hệt trước.** Không thêm tính năng, không đổi UI.
- **Không đụng** các route ghi (`/api/games/studio`, `/api/games/[slug]`, `/api/admin/games`) — chúng thành proxy ở W4.
- **Không đụng** products/downloads (`ecosystem.ts`, `DownloadCenter`, `ProductDetail`…) — đó là W5, và có ràng buộc client/server riêng (spec §13).
- **Giữ nguyên tên & vị trí** `getCatalog()` / `getCatalogGame()` trong `src/lib/game-catalog.ts` — chỉ đổi thành `async`.
- **Bất biến (spec §3.2, bẫy #3):** game `source: "user"` **luôn** `sandboxed: true`, và `embedUrl` **luôn** do web dựng từ `GAMES_ORIGIN` — **không bao giờ** lấy từ payload nguồn.
- Test: **vitest**, file `.test.ts` đặt cạnh file nguồn. Chạy: `npm test`.
- **Không** thêm `import "server-only"` vào file có test (gói `server-only` throw khi import ngoài bundle server → vỡ vitest). Chỉ đặt ở `dashboard/index.ts` và `game-catalog.ts`.

---

### Task 1: DTO + mapper tiêu thụ DTO (nền móng)

Hôm nay `mapUserGame()` nhận thẳng `DbGame` (kiểu của SQLite, snake_case). Như vậy mapper **dính chặt vào SQLite** — adapter `dashboard` sau này không dùng lại được. Task này tách ra: mapper nhận **DTO trung lập** `UserGame`, còn việc "SQLite row → DTO" là việc riêng của adapter local.

**Files:**
- Create: `src/lib/dashboard/types.ts`
- Create: `src/lib/dashboard/adapters/local.ts`
- Create: `src/lib/dashboard/adapters/local.test.ts`
- Modify: `src/lib/game-catalog-map.ts`
- Modify: `src/lib/game-catalog-map.test.ts`
- Modify: `src/lib/game-catalog.ts:9`

**Interfaces:**
- Produces: `CatalogGame`, `UserGame`, `StudioGameSummary` (trong `@/lib/dashboard/types`); `dbToUserGame(db: DbGame): UserGame` (trong `@/lib/dashboard/adapters/local`); `mapUserGame(g: UserGame): CatalogGame` (chữ ký ĐỔI — trước nhận `DbGame`).
- Consumes: `DbGame`, `GamesStore`, `createGamesStore` từ `@/lib/games-db`; `Game` từ `@/content/types`.

- [ ] **Step 1: Tạo DTO**

Create `src/lib/dashboard/types.ts`:

```ts
import type { Localized } from "@/content/types";

/**
 * Game như UI hiển thị (Game Hub + trang chi tiết).
 * MỌI nguồn dữ liệu (SQLite hôm nay, REST API của Dashboard mai kia) đều phải
 * quy về đúng shape này. Đây là ranh giới chống lệch.
 */
export interface CatalogGame {
  id: string;
  slug: string;
  title: string;
  author: string;
  year?: number;
  cover?: string;
  tags?: string[];
  blurb?: Localized;
  source: "lab" | "user";
  embedUrl: string;
  sandboxed: boolean;
  tagline?: string;
  description?: string;
  classification?: string;
  projectType?: string;
  releaseStatus?: string;
  genre?: string;
  externalUrl?: string;
  videoUrl?: string;
}

/**
 * Game do người dùng nộp — DTO trung lập.
 * KHÔNG phụ thuộc SQLite (snake_case) hay JSON của API. Adapter có nhiệm vụ
 * quy dữ liệu thô của mình về đúng đây.
 */
export interface UserGame {
  id: string;
  slug: string;
  title: string;
  author: string;
  status: string; // draft | pending | published | rejected
  ownerId: string | null;
  ownerEmail: string | null;
  cover: string | null;
  createdAt: string; // ISO
  updatedAt: string | null;
  tagline: string | null;
  description: string | null;
  classification: string | null;
  projectType: string | null;
  releaseStatus: string | null;
  genre: string | null;
  tags: string | null; // CSV: "a, b, c"
  externalUrl: string | null;
  videoUrl: string | null;
}

/** Một dòng trong bảng Studio của tác giả. */
export interface StudioGameSummary {
  slug: string;
  title: string;
  status: string;
}
```

- [ ] **Step 2: Viết test thất bại cho mapper + bất biến sandbox/origin**

Replace `src/lib/game-catalog-map.test.ts` bằng:

```ts
import { describe, it, expect } from "vitest";
import { mapLabGame, mapUserGame } from "./game-catalog-map";
import type { Game } from "@/content/types";
import type { UserGame } from "@/lib/dashboard/types";

const lab: Game = {
  id: "g", slug: "g", title: "G", author: "A", year: 2024, embedPath: "/games/g/index.html",
  tags: ["Unity"], tagline: { en: "EN", vi: "VI tagline" }, description: { en: "e", vi: "v desc" },
  classification: "game", projectType: "web", releaseStatus: "released", genre: "Puzzle",
};

const user: UserGame = {
  id: "1", slug: "u", title: "U", author: "B", status: "published",
  ownerId: "x", ownerEmail: null, cover: null,
  createdAt: "2026-06-24T00:00:00Z", updatedAt: null,
  tagline: "tag", description: "**md**", classification: "demo",
  projectType: "web", releaseStatus: "in_dev", genre: "Action",
  tags: "a, b ,c", externalUrl: null, videoUrl: null,
};

describe("mapLabGame", () => {
  it("maps lab fields (VI prose, same-origin, not sandboxed)", () => {
    const c = mapLabGame(lab);
    expect(c.source).toBe("lab");
    expect(c.sandboxed).toBe(false);
    expect(c.embedUrl).toBe("/games/g/index.html");
    expect(c.tagline).toBe("VI tagline");
    expect(c.description).toBe("v desc");
    expect(c.classification).toBe("game");
    expect(c.genre).toBe("Puzzle");
  });
});

describe("mapUserGame", () => {
  it("maps DTO fields (CSV tags, cross-origin, sandboxed)", () => {
    const c = mapUserGame(user);
    expect(c.source).toBe("user");
    expect(c.sandboxed).toBe(true);
    expect(c.embedUrl).toContain("/u/index.html");
    expect(c.tags).toEqual(["a", "b", "c"]);
    expect(c.tagline).toBe("tag");
    expect(c.projectType).toBe("web");
    expect(c.releaseStatus).toBe("in_dev");
    expect(c.year).toBe(2026);
  });

  it("BẤT BIẾN: embedUrl do web dựng từ GAMES_ORIGIN + luôn sandboxed — không tin payload", () => {
    const rogue = { ...user, embedUrl: "https://evil.example/pwn.html", sandboxed: false } as unknown as UserGame;
    const c = mapUserGame(rogue);
    expect(c.sandboxed).toBe(true);
    expect(c.embedUrl).not.toContain("evil.example");
    expect(c.embedUrl).toMatch(/\/u\/index\.html$/);
  });
});
```

- [ ] **Step 3: Chạy test — phải THẤT BẠI**

Run: `npx vitest run src/lib/game-catalog-map.test.ts`
Expected: FAIL — TypeScript/runtime lỗi vì `mapUserGame` đang nhận `DbGame` (`g.project_type`), còn test truyền DTO camelCase (`projectType`). Các assert `projectType`/`releaseStatus` sẽ là `undefined`.

- [ ] **Step 4: Sửa mapper để nhận DTO**

Replace `src/lib/game-catalog-map.ts` bằng:

```ts
import type { Game } from "@/content/types";
import type { CatalogGame, UserGame } from "@/lib/dashboard/types";

// Re-export để mọi import cũ (`@/lib/game-catalog-map`) vẫn chạy.
export type { CatalogGame } from "@/lib/dashboard/types";

const GAMES_ORIGIN = process.env.GAMES_ORIGIN || "https://games.ctslab.net";

export function mapLabGame(g: Game): CatalogGame {
  return {
    id: g.id, slug: g.slug, title: g.title, author: g.author, year: g.year,
    cover: g.cover, tags: g.tags, blurb: g.blurb,
    source: "lab", embedUrl: g.embedPath, sandboxed: false,
    tagline: g.tagline?.vi, description: g.description?.vi,
    classification: g.classification, projectType: g.projectType,
    releaseStatus: g.releaseStatus, genre: g.genre,
    externalUrl: g.externalUrl, videoUrl: g.videoUrl,
  };
}

export function mapUserGame(g: UserGame): CatalogGame {
  return {
    id: g.id, slug: g.slug, title: g.title, author: g.author,
    year: g.createdAt ? new Date(g.createdAt).getFullYear() : undefined,
    cover: g.cover ?? undefined,
    tags: g.tags ? g.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
    source: "user",
    // BẤT BIẾN: origin do web quyết định, KHÔNG lấy từ payload nguồn
    // (chống origin injection khi dữ liệu đến từ API bên ngoài).
    embedUrl: `${GAMES_ORIGIN}/${g.slug}/index.html`,
    sandboxed: true,
    tagline: g.tagline ?? undefined,
    description: g.description ?? undefined,
    classification: g.classification ?? undefined,
    projectType: g.projectType ?? undefined,
    releaseStatus: g.releaseStatus ?? undefined,
    genre: g.genre ?? undefined,
    externalUrl: g.externalUrl ?? undefined,
    videoUrl: g.videoUrl ?? undefined,
  };
}
```

- [ ] **Step 5: Viết test thất bại cho `dbToUserGame`**

Create `src/lib/dashboard/adapters/local.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { dbToUserGame } from "./local";
import type { DbGame } from "@/lib/games-db";

describe("dbToUserGame", () => {
  it("quy SQLite row (snake_case) về DTO (camelCase)", () => {
    const row: DbGame = {
      id: "1", slug: "u", title: "U", author: "B", cover: null, status: "pending",
      created_at: "2026-06-24T00:00:00Z", owner_id: "u1", owner_email: "u1@x",
      tagline: "tag", description: "**md**", classification: "demo",
      project_type: "web", release_status: "in_dev", genre: "Action",
      tags: "a,b", video_url: "https://v", external_url: "https://e",
      updated_at: "2026-06-25T00:00:00Z",
    };
    expect(dbToUserGame(row)).toEqual({
      id: "1", slug: "u", title: "U", author: "B", status: "pending",
      ownerId: "u1", ownerEmail: "u1@x", cover: null,
      createdAt: "2026-06-24T00:00:00Z", updatedAt: "2026-06-25T00:00:00Z",
      tagline: "tag", description: "**md**", classification: "demo",
      projectType: "web", releaseStatus: "in_dev", genre: "Action",
      tags: "a,b", externalUrl: "https://e", videoUrl: "https://v",
    });
  });

  it("cột thiếu (undefined trong SQLite) → null trong DTO, không phải undefined", () => {
    const row: DbGame = {
      id: "2", slug: "m", title: "M", author: "B", cover: null, status: "draft",
      created_at: "2026-06-24T00:00:00Z", owner_id: null, owner_email: null,
    };
    const dto = dbToUserGame(row);
    expect(dto.tagline).toBeNull();
    expect(dto.projectType).toBeNull();
    expect(dto.updatedAt).toBeNull();
  });
});
```

- [ ] **Step 6: Chạy test — phải THẤT BẠI**

Run: `npx vitest run src/lib/dashboard/adapters/local.test.ts`
Expected: FAIL — `Failed to resolve import "./local"` (file chưa tồn tại).

- [ ] **Step 7: Viết `dbToUserGame`**

Create `src/lib/dashboard/adapters/local.ts`:

```ts
import type { DbGame } from "@/lib/games-db";
import type { UserGame } from "@/lib/dashboard/types";

/**
 * SQLite row → DTO trung lập.
 * Chỉ adapter local được phép biết tới snake_case của SQLite; phần còn lại của
 * codebase chỉ thấy `UserGame`.
 */
export function dbToUserGame(g: DbGame): UserGame {
  return {
    id: g.id,
    slug: g.slug,
    title: g.title,
    author: g.author,
    status: g.status,
    ownerId: g.owner_id ?? null,
    ownerEmail: g.owner_email ?? null,
    cover: g.cover ?? null,
    createdAt: g.created_at,
    updatedAt: g.updated_at ?? null,
    tagline: g.tagline ?? null,
    description: g.description ?? null,
    classification: g.classification ?? null,
    projectType: g.project_type ?? null,
    releaseStatus: g.release_status ?? null,
    genre: g.genre ?? null,
    tags: g.tags ?? null,
    externalUrl: g.external_url ?? null,
    videoUrl: g.video_url ?? null,
  };
}
```

- [ ] **Step 8: Nối lại `game-catalog.ts` để repo xanh (vẫn sync, chưa đổi hành vi)**

Modify `src/lib/game-catalog.ts` — dòng 9 hiện là:
```ts
  return [...getGames().map(mapLabGame), ...getGamesStore().listPublished().map(mapUserGame)];
```
Đổi thành (thêm `dbToUserGame` vào giữa):
```ts
  return [
    ...getGames().map(mapLabGame),
    ...getGamesStore().listPublished().map(dbToUserGame).map(mapUserGame),
  ];
```
Và thêm import ở đầu file:
```ts
import { dbToUserGame } from "@/lib/dashboard/adapters/local";
```

- [ ] **Step 9: Chạy toàn bộ test + typecheck — phải XANH**

Run: `npm test`
Expected: PASS (toàn bộ, kể cả `game-catalog-map.test.ts` và `local.test.ts`)

Run: `npx tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 10: Commit**

```bash
git add src/lib/dashboard/types.ts src/lib/dashboard/adapters/local.ts \
        src/lib/dashboard/adapters/local.test.ts \
        src/lib/game-catalog-map.ts src/lib/game-catalog-map.test.ts src/lib/game-catalog.ts
git commit -m "refactor(games): tách DTO UserGame — mapper hết dính SQLite

mapUserGame() nay nhận DTO trung lập thay vì DbGame; việc quy SQLite row về
DTO là dbToUserGame() trong adapter local. Adapter dashboard sau này dùng lại
đúng mapper đó.

Thêm test bất biến: game user luôn sandboxed + embedUrl dựng từ GAMES_ORIGIN,
không bao giờ lấy từ payload (chống origin injection)."
```

---

### Task 2: Port + adapter local + rewire đường đọc catalog

**Files:**
- Create: `src/lib/dashboard/port.ts`
- Create: `src/lib/dashboard/index.ts`
- Modify: `src/lib/dashboard/adapters/local.ts` (thêm `createLocalGamesSource` + `localGamesSource`)
- Modify: `src/lib/dashboard/adapters/local.test.ts` (thêm test cho source)
- Modify: `src/lib/game-catalog.ts` (async, qua port)
- Modify: `src/app/games/page.tsx:14`
- Modify: `src/app/games/[slug]/page.tsx`
- Modify: `src/app/admin/games/page.tsx:17`

**Interfaces:**
- Consumes: `dbToUserGame`, `mapLabGame`, `mapUserGame`, `CatalogGame`, `UserGame`, `StudioGameSummary` (Task 1).
- Produces:
  - `interface GamesSource` với 4 phương thức: `getPublishedGames(): Promise<CatalogGame[]>`, `getGameBySlug(slug: string): Promise<CatalogGame | undefined>`, `getUserGame(slug: string): Promise<UserGame | undefined>`, `getMyGames(ownerId: string): Promise<StudioGameSummary[]>` (trong `@/lib/dashboard/port`).
  - `createLocalGamesSource(getStore: () => GamesStore): GamesSource` và `localGamesSource: GamesSource` (trong `@/lib/dashboard/adapters/local`).
  - `getGamesSource(): GamesSource` (trong `@/lib/dashboard`).
  - `getCatalog(): Promise<CatalogGame[]>` và `getCatalogGame(slug): Promise<CatalogGame | undefined>` — **cùng tên như cũ, nay async**.

- [ ] **Step 1: Định nghĩa port**

Create `src/lib/dashboard/port.ts`:

```ts
import type { CatalogGame, StudioGameSummary, UserGame } from "./types";

/**
 * Hợp đồng dữ liệu game của website. Đây là NƠI DUY NHẤT nói "web cần gì".
 * Đổi interface này = đổi spec trước, code sau.
 *
 * Mọi hàm đều async — kể cả adapter local đọc đồng bộ — để đổi sang adapter
 * dashboard (mạng) không phải sửa một call-site nào.
 */
export interface GamesSource {
  /** Game hiển thị công khai ở Game Hub: game của lab + game user đã published. */
  getPublishedGames(): Promise<CatalogGame[]>;

  /** Một game công khai theo slug. `undefined` nếu không tồn tại HOẶC chưa published. */
  getGameBySlug(slug: string): Promise<CatalogGame | undefined>;

  /** Game do user nộp, MỌI trạng thái (để owner/admin xem & sửa bản chưa duyệt). */
  getUserGame(slug: string): Promise<UserGame | undefined>;

  /** Game của một tác giả, mọi trạng thái — dựng bảng trong Studio. */
  getMyGames(ownerId: string): Promise<StudioGameSummary[]>;
}
```

- [ ] **Step 2: Viết test thất bại cho adapter local**

Trong `src/lib/dashboard/adapters/local.test.ts`:

**(a)** Gộp `createLocalGamesSource` vào import sẵn có ở đầu file (đừng thêm dòng `import ... from "./local"` thứ hai — ESLint sẽ báo trùng import):
```ts
import { dbToUserGame, createLocalGamesSource } from "./local";
```
**(b)** Thêm import store, cũng ở đầu file:
```ts
import { createGamesStore } from "@/lib/games-db";
```
**(c)** Thêm vào cuối file:

```ts
function seeded() {
  const store = createGamesStore(":memory:");
  const base = { author: "A", cover: null, created_at: "2026-06-24T00:00:00Z" };
  store.insert({ id: "1", slug: "pub", title: "Pub", status: "published", owner_id: "u1", owner_email: "u1@x", ...base });
  store.insert({ id: "2", slug: "draft", title: "Draft", status: "draft", owner_id: "u1", owner_email: "u1@x", ...base });
  store.insert({ id: "3", slug: "other", title: "Other", status: "published", owner_id: "u2", owner_email: "u2@x", ...base });
  return createLocalGamesSource(() => store);
}

describe("localGamesSource", () => {
  it("getPublishedGames: gộp game lab (tĩnh) + game user đã published, loại draft", async () => {
    const games = await seeded().getPublishedGames();
    const slugs = games.map((g) => g.slug);
    expect(slugs).toContain("pub");
    expect(slugs).toContain("other");
    expect(slugs).not.toContain("draft");
    // Game của lab vẫn được gộp vào (nguồn tĩnh trong repo — spec D3).
    // Kiểm theo `source`, KHÔNG hardcode slug — để test không vỡ khi lab đổi game.
    expect(games.some((g) => g.source === "lab")).toBe(true);
  });

  it("getPublishedGames: game lab không sandbox, game user thì có", async () => {
    const games = await seeded().getPublishedGames();
    expect(games.filter((g) => g.source === "lab").every((g) => g.sandboxed === false)).toBe(true);
    expect(games.filter((g) => g.source === "user").every((g) => g.sandboxed === true)).toBe(true);
  });

  it("getGameBySlug: chỉ thấy game published", async () => {
    const s = seeded();
    expect((await s.getGameBySlug("pub"))?.title).toBe("Pub");
    expect(await s.getGameBySlug("draft")).toBeUndefined();
    expect(await s.getGameBySlug("khong-ton-tai")).toBeUndefined();
  });

  it("getUserGame: thấy game mọi trạng thái (để owner sửa bản nháp)", async () => {
    const s = seeded();
    const g = await s.getUserGame("draft");
    expect(g?.status).toBe("draft");
    expect(g?.ownerId).toBe("u1");
    expect(await s.getUserGame("khong-ton-tai")).toBeUndefined();
  });

  it("getMyGames: chỉ trả game của owner đó", async () => {
    const s = seeded();
    expect((await s.getMyGames("u1")).map((g) => g.slug).sort()).toEqual(["draft", "pub"]);
    expect(await s.getMyGames("nguoi-la")).toEqual([]);
  });
});
```

- [ ] **Step 3: Chạy test — phải THẤT BẠI**

Run: `npx vitest run src/lib/dashboard/adapters/local.test.ts`
Expected: FAIL — `createLocalGamesSource is not exported` / không tồn tại.

- [ ] **Step 4: Cài đặt adapter local**

Append vào `src/lib/dashboard/adapters/local.ts` (giữ nguyên `dbToUserGame` đã có):

```ts
import { getGames } from "@/content/games";
import { getGamesStore, type GamesStore } from "@/lib/games-db";
import { mapLabGame, mapUserGame } from "@/lib/game-catalog-map";
import type { GamesSource } from "@/lib/dashboard/port";

/**
 * Adapter nguồn hiện tại: game của lab từ content tĩnh + game user từ SQLite.
 * Nhận `getStore` (hàm) chứ không phải store — để không mở DB lúc import module,
 * và để test bơm được store `:memory:`.
 */
export function createLocalGamesSource(getStore: () => GamesStore): GamesSource {
  const source: GamesSource = {
    async getPublishedGames() {
      return [
        ...getGames().map(mapLabGame),
        ...getStore().listPublished().map(dbToUserGame).map(mapUserGame),
      ];
    },
    async getGameBySlug(slug) {
      return (await source.getPublishedGames()).find((g) => g.slug === slug);
    },
    async getUserGame(slug) {
      const row = getStore().get(slug);
      return row ? dbToUserGame(row) : undefined;
    },
    async getMyGames(ownerId) {
      return getStore()
        .listByOwner(ownerId)
        .map((g) => ({ slug: g.slug, title: g.title, status: g.status }));
    },
  };
  return source;
}

/** Instance dùng thật. `getGamesStore` là lazy-singleton nên truyền hàm là an toàn. */
export const localGamesSource: GamesSource = createLocalGamesSource(getGamesStore);
```

- [ ] **Step 5: Chạy test — phải XANH**

Run: `npx vitest run src/lib/dashboard/adapters/local.test.ts`
Expected: PASS (tất cả).

- [ ] **Step 6: Tạo điểm vào của port**

Create `src/lib/dashboard/index.ts`:

```ts
import "server-only";
import type { GamesSource } from "./port";
import { localGamesSource } from "./adapters/local";

/**
 * Nguồn dữ liệu game đang dùng.
 * W3/W4 sẽ thêm adapter "dashboard" và chọn theo ENV `CTSLAB_DATA_SOURCE`;
 * lúc đó chỉ sửa đúng hàm này, không đụng call-site nào.
 */
export function getGamesSource(): GamesSource {
  return localGamesSource;
}

export type { GamesSource } from "./port";
export type { CatalogGame, UserGame, StudioGameSummary } from "./types";
```

- [ ] **Step 7: Rewire `game-catalog.ts` sang port (async)**

Replace `src/lib/game-catalog.ts` bằng:

```ts
import "server-only";
import { getGamesSource } from "@/lib/dashboard";

export type { CatalogGame } from "@/lib/dashboard/types";

/** Catalog công khai. Tên giữ nguyên; nay async vì nguồn có thể là mạng. */
export function getCatalog() {
  return getGamesSource().getPublishedGames();
}

export function getCatalogGame(slug: string) {
  return getGamesSource().getGameBySlug(slug);
}
```

- [ ] **Step 8: Cập nhật call-site — Game Hub**

Modify `src/app/games/page.tsx`. Hàm component đổi thành `async` và `await getCatalog()`:

```tsx
export default async function GamesPage() {
  const games = await getCatalog();
  return (
    <>
      <Navbar />
      <main><GameHubView games={games} /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 9: Cập nhật call-site — trang chi tiết game**

Modify `src/app/games/[slug]/page.tsx`. Thay import `getGamesStore` + `mapUserGame` từ chỗ cũ, và đổi `resolve()`:

Imports (dòng 6–9) đổi thành:
```tsx
import { getCatalogGame } from "@/lib/game-catalog";
import { getGamesSource } from "@/lib/dashboard";
import { mapUserGame } from "@/lib/game-catalog-map";
import type { CatalogGame } from "@/lib/dashboard/types";
import { auth } from "@/auth";
```

Hàm `resolve` đổi thành:
```tsx
async function resolve(slug: string): Promise<{ game: CatalogGame; notPublic: boolean } | null> {
  const pub = await getCatalogGame(slug);
  if (pub) return { game: pub, notPublic: false };
  const g = await getGamesSource().getUserGame(slug);
  if (!g) return null;
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const uid = u?.id || u?.email || null;
  const isAdmin = (session as { isAdmin?: boolean } | null)?.isAdmin === true;
  if (uid && (g.ownerId === uid || isAdmin)) return { game: mapUserGame(g), notPublic: true };
  return null;
}
```
> Lưu ý: `db.owner_id` cũ → `g.ownerId` (DTO camelCase).

- [ ] **Step 10: Cập nhật call-site — trang admin (sẽ bị xoá ở W4, chỉ thêm `await`)**

Modify `src/app/admin/games/page.tsx` dòng 17:
```tsx
  const games = (await getCatalog()).filter((g) => g.source === "user");
```
Giữ nguyên dòng 18 (`getGamesStore().listByStatus("pending")`) — trang này bị xoá ở W4, không cần đưa qua port.

- [ ] **Step 11: Chạy test + typecheck + build**

Run: `npm test`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: không lỗi.

Run: `npm run build`
Expected: build thành công (đây là bước bắt lỗi async/server component).

- [ ] **Step 12: Commit**

```bash
git add src/lib/dashboard/ src/lib/game-catalog.ts \
        src/app/games/page.tsx "src/app/games/[slug]/page.tsx" src/app/admin/games/page.tsx
git commit -m "feat(data): port GamesSource + adapter local; catalog đọc qua port

Mọi đường ĐỌC game của web nay đi qua interface GamesSource. Adapter local
giữ nguyên nguồn hiện tại (content tĩnh + SQLite) nên hành vi không đổi.
getCatalog()/getCatalogGame() giữ tên, chuyển async.

W3/W4 chỉ cần thêm adapter dashboard và sửa getGamesSource() — không đụng UI."
```

---

### Task 3: Studio đọc qua port

Sau task này, **không còn trang nào đọc thẳng SQLite** (chỉ các route GHI còn đọc — chúng thành proxy ở W4).

**Files:**
- Modify: `src/app/games/studio/page.tsx:8,39`
- Modify: `src/app/games/studio/[slug]/edit/page.tsx:8,21-31`

**Interfaces:**
- Consumes: `getGamesSource()` → `getMyGames(ownerId)`, `getUserGame(slug)` (Task 2).

- [ ] **Step 1: Studio dashboard đọc qua port**

Modify `src/app/games/studio/page.tsx`:

Đổi import dòng 8 từ `import { getGamesStore } from "@/lib/games-db";` thành:
```tsx
import { getGamesSource } from "@/lib/dashboard";
```

Đổi dòng 39 từ:
```tsx
  const games = getGamesStore().listByOwner(ownerId).map((g) => ({ slug: g.slug, title: g.title, status: g.status }));
```
thành:
```tsx
  const games = await getGamesSource().getMyGames(ownerId);
```
> `getMyGames` đã trả đúng `{ slug, title, status }[]` mà `StudioDashboard` cần — không cần map thêm.

- [ ] **Step 2: Trang sửa game đọc qua port**

Modify `src/app/games/studio/[slug]/edit/page.tsx`:

Đổi import dòng 8 thành:
```tsx
import { getGamesSource } from "@/lib/dashboard";
```

Đổi dòng 21–31 thành:
```tsx
  const g = await getGamesSource().getUserGame(slug);
  if (!g) notFound();
  const isAdmin = (session as { isAdmin?: boolean }).isAdmin === true;
  if (g.ownerId !== uid && !isAdmin) notFound();

  const initial: GameFormData = {
    title: g.title, author: g.author, tagline: g.tagline ?? "", cover: g.cover ?? "",
    classification: g.classification ?? "game", projectType: g.projectType ?? "web",
    releaseStatus: g.releaseStatus ?? "in_dev", genre: g.genre ?? "", tags: g.tags ?? "",
    description: g.description ?? "", externalUrl: g.externalUrl ?? "", videoUrl: g.videoUrl ?? "",
  };
```
> Đổi tên trường: `g.owner_id`→`g.ownerId`, `g.project_type`→`g.projectType`, `g.release_status`→`g.releaseStatus`, `g.external_url`→`g.externalUrl`, `g.video_url`→`g.videoUrl`. Giá trị mặc định (`"game"`, `"web"`, `"in_dev"`) **giữ y như cũ**.

- [ ] **Step 3: Xác minh không còn trang nào import `games-db`**

Run:
```bash
grep -rn "games-db" src/app/games src/app/admin --include=*.tsx
```
Expected: **không có kết quả** cho `src/app/games/**`. Chỉ còn `src/app/admin/games/page.tsx` (đúng như thiết kế — xoá ở W4).

- [ ] **Step 4: Test + typecheck + build**

Run: `npm test`
Expected: PASS.

Run: `npx tsc --noEmit && npm run build`
Expected: không lỗi, build thành công.

- [ ] **Step 5: Commit**

```bash
git add src/app/games/studio/page.tsx "src/app/games/studio/[slug]/edit/page.tsx"
git commit -m "refactor(studio): đọc game qua port thay vì SQLite trực tiếp

Không còn trang nào ở /games đọc thẳng DB. Các route GHI vẫn dùng store —
chúng sẽ thành proxy tới Dashboard ở W4."
```

---

### Task 4: Bộ test hợp đồng (khoá chống lệch)

Đây là **lý do tồn tại của cả lát W1**: một bộ test mà **mọi** adapter phải qua. Khi W4 thêm adapter `dashboard`, nó chạy đúng bộ này — nếu API trả dữ liệu lệch shape hay lộ game chưa duyệt, test đỏ ngay.

**Files:**
- Create: `src/lib/dashboard/games-source.contract.ts`
- Modify: `src/lib/dashboard/adapters/local.test.ts` (chạy contract)

**Interfaces:**
- Consumes: `GamesSource` (Task 2).
- Produces: `runGamesSourceContract(name: string, setup: () => Promise<ContractSetup>): void` và `interface ContractSetup { source: GamesSource; publishedUserSlug: string; hiddenUserSlug: string; ownerId: string; ownerGameCount: number }` (trong `@/lib/dashboard/games-source.contract`).

> Đặt tên file là `.contract.ts` (KHÔNG phải `.test.ts`) để vitest không chạy nó độc lập — `vitest.config.ts` chỉ include `src/**/*.test.{ts,tsx}`.

- [ ] **Step 1: Viết bộ hợp đồng**

Create `src/lib/dashboard/games-source.contract.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { GamesSource } from "./port";

export interface ContractSetup {
  source: GamesSource;
  /** Một game USER đã published. */
  publishedUserSlug: string;
  /** Một game USER CHƯA published (draft/pending) — không được lộ ra công khai. */
  hiddenUserSlug: string;
  /** Owner sở hữu cả hai game trên. */
  ownerId: string;
  /** Số game của owner đó (mọi trạng thái). */
  ownerGameCount: number;
}

/**
 * Hợp đồng mà MỌI GamesSource phải thoả (local hôm nay, dashboard mai kia).
 * Đây là lưới chống lệch: adapter mới phải chạy đúng bộ này, không được viết
 * bộ test riêng "dễ hơn".
 */
export function runGamesSourceContract(name: string, setup: () => Promise<ContractSetup>) {
  describe(`GamesSource contract — ${name}`, () => {
    it("KHÔNG lộ game chưa published ra catalog công khai", async () => {
      const c = await setup();
      const slugs = (await c.source.getPublishedGames()).map((g) => g.slug);
      expect(slugs).toContain(c.publishedUserSlug);
      expect(slugs).not.toContain(c.hiddenUserSlug);
    });

    it("BẤT BIẾN: game source='user' luôn sandboxed + embedUrl tuyệt đối, trỏ đúng slug", async () => {
      const c = await setup();
      const userGames = (await c.source.getPublishedGames()).filter((g) => g.source === "user");
      expect(userGames.length).toBeGreaterThan(0);
      for (const g of userGames) {
        expect(g.sandboxed).toBe(true);
        expect(g.embedUrl).toMatch(/^https?:\/\//);
        expect(g.embedUrl).toContain(`/${g.slug}/index.html`);
      }
    });

    it("mọi game trong catalog đều có slug, title, embedUrl không rỗng", async () => {
      const c = await setup();
      for (const g of await c.source.getPublishedGames()) {
        expect(g.slug.length).toBeGreaterThan(0);
        expect(g.title.length).toBeGreaterThan(0);
        expect(g.embedUrl.length).toBeGreaterThan(0);
      }
    });

    it("getGameBySlug: trả game published; undefined với game ẩn hoặc slug lạ", async () => {
      const c = await setup();
      expect((await c.source.getGameBySlug(c.publishedUserSlug))?.slug).toBe(c.publishedUserSlug);
      expect(await c.source.getGameBySlug(c.hiddenUserSlug)).toBeUndefined();
      expect(await c.source.getGameBySlug("slug-khong-bao-gio-ton-tai")).toBeUndefined();
    });

    it("getUserGame: thấy game MỌI trạng thái; undefined với slug lạ", async () => {
      const c = await setup();
      expect((await c.source.getUserGame(c.hiddenUserSlug))?.slug).toBe(c.hiddenUserSlug);
      expect(await c.source.getUserGame("slug-khong-bao-gio-ton-tai")).toBeUndefined();
    });

    it("getMyGames: chỉ trả game của owner; owner lạ → mảng rỗng", async () => {
      const c = await setup();
      expect(await c.source.getMyGames(c.ownerId)).toHaveLength(c.ownerGameCount);
      expect(await c.source.getMyGames("owner-khong-ton-tai")).toEqual([]);
    });
  });
}
```

- [ ] **Step 2: Cho adapter local chạy bộ hợp đồng**

Trong `src/lib/dashboard/adapters/local.test.ts`:

**(a)** Thêm import **ở đầu file**, cùng khối với các import khác (import phải nằm ở top-level đầu file — đặt cuối file sẽ vi phạm lint):
```ts
import { runGamesSourceContract } from "../games-source.contract";
```
**(b)** Thêm vào cuối file (tái dùng `seeded()` đã viết ở Task 2):
```ts
runGamesSourceContract("local", async () => ({
  source: seeded(),
  publishedUserSlug: "pub",
  hiddenUserSlug: "draft",
  ownerId: "u1",
  ownerGameCount: 2,
}));
```

- [ ] **Step 3: Chạy test — phải XANH**

Run: `npx vitest run src/lib/dashboard/adapters/local.test.ts`
Expected: PASS — thấy thêm nhóm `GamesSource contract — local` với 6 test.

- [ ] **Step 4: Chứng minh bộ hợp đồng thật sự bắt lỗi (kiểm tra ngược)**

Một bộ test luôn xanh thì vô dụng — phải chứng minh nó bắt được lỗi thật.

Sửa **tạm** `src/lib/dashboard/adapters/local.ts`: trong `getPublishedGames`, đổi `getStore().listPublished()` thành `getStore().listByStatus("draft")`.

Run: `npx vitest run src/lib/dashboard/adapters/local.test.ts`
Expected: **FAIL** ở test `KHÔNG lộ game chưa published` (và cả test của `localGamesSource`).

Hoàn tác (file đã được commit ở Task 2 nên an toàn):
```bash
git checkout -- src/lib/dashboard/adapters/local.ts
```

Run: `npx vitest run src/lib/dashboard/adapters/local.test.ts`
Expected: PASS trở lại.

- [ ] **Step 5: Chạy full + commit**

Run: `npm test && npx tsc --noEmit`
Expected: PASS, không lỗi type.

```bash
git add src/lib/dashboard/games-source.contract.ts src/lib/dashboard/adapters/local.test.ts
git commit -m "test(data): bộ hợp đồng GamesSource — lưới chống lệch cho adapter

Mọi adapter (local hôm nay, dashboard ở W4) phải qua đúng bộ này: không lộ
game chưa duyệt, game user luôn sandboxed + embedUrl dựng từ GAMES_ORIGIN,
getMyGames không rò game của owner khác."
```

---

## Kiểm tra cuối lát (làm sau Task 4)

- [ ] `npm test` — xanh toàn bộ.
- [ ] `npx tsc --noEmit` — không lỗi.
- [ ] `npm run build` — build thành công.
- [ ] `npm run lint` — không lỗi mới.
- [ ] **Kiểm tra hành vi thật (W1 là refactor — người dùng phải không thấy gì khác):** dùng skill `/verify` hoặc chạy `npm run dev` rồi kiểm:
  - `/games` — Game Hub hiện đủ game như trước (lab + user published), lọc/tìm kiếm vẫn chạy.
  - `/games/tyrp` — game của lab chạy được (nhúng cùng origin).
  - `/games/<slug-user>` — game user chạy được (iframe sandbox, origin `games.ctslab.net`).
  - `/games/studio` (đăng nhập) — thấy đúng danh sách game của mình kèm trạng thái.
  - `/games/studio/<slug>/edit` — form prefill đúng mọi trường (đặc biệt `projectType`, `releaseStatus`).
- [ ] Không có file nào trong `src/app/games/**` còn import `@/lib/games-db`.

## Ngoài phạm vi lát này (đừng làm)

- News (W2) · adapter `dashboard` (W3) · Studio proxy + xoá `/admin` (W4) · Downloads + gỡ SQLite (W5).
- Không đổi `ecosystem.ts`, `products.ts`, hay bất kỳ component products/download nào (spec §13).
