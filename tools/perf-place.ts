/**
 * One-off perf measurement: time the two PLACE clicks on a fresh game.
 *
 * Compares two servers (prod preview without React Scan vs dev with React Scan)
 * to quantify how much of the user-reported 269ms "other time" is real CYCLES
 * cost vs dev-tooling instrumentation overhead.
 *
 * Run with:
 *   bun run tools/perf-place.ts
 *
 * Servers must already be listening:
 *   bun run build && bun run preview --port 4174   # prod (no React Scan)
 *   bun run dev    --port 5174                     # dev  (with React Scan)
 */

import { chromium } from "playwright";

const PREVIEW_URL = "http://localhost:4174";
const DEV_URL = "http://localhost:5174";
const SAMPLES = 3;
const VIEWPORT = { width: 1280, height: 800 } as const;
const TARGET_ROW = 3;
const TARGET_COL = 3;

interface SampleResult {
  readonly click1Ms: number;
  readonly click2Ms: number;
}

interface Stats {
  readonly n: number;
  readonly median: number;
  readonly min: number;
  readonly max: number;
  readonly mean: number;
}

function stat(arr: readonly number[]): Stats {
  const sorted = [...arr].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
  const min = sorted[0] ?? Number.NaN;
  const max = sorted[sorted.length - 1] ?? Number.NaN;
  const mean = arr.reduce((s, n) => s + n, 0) / Math.max(1, arr.length);
  return { n: arr.length, median, min, max, mean };
}

function fmt(s: Stats): string {
  return `n=${s.n}  median=${s.median.toFixed(1)}ms  mean=${s.mean.toFixed(1)}ms  range=[${s.min.toFixed(1)}..${s.max.toFixed(1)}]`;
}

async function measureOnce(url: string): Promise<SampleResult> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    // Silence app logs.
    page.on("console", () => {});

    // `domcontentloaded` is enough; the dev server's HMR + React Scan keep the
    // network non-idle indefinitely, so `networkidle` would hang.
    await page.goto(`${url}/?mode=human`, { waitUntil: "domcontentloaded" });
    // Wait for the board to actually mount; this is the real readiness signal.
    await page.waitForSelector("[data-testid='board-view']", { timeout: 15000 });
    // GridView aria-label is `Intersection r{r+1} c{c+1}[ (legal placement)]`;
    // prefix-match via `^=` so "(legal placement)" doesn't break selection.
    await page.waitForSelector(
      `[aria-label^="Intersection r${TARGET_ROW + 1} c${TARGET_COL + 1}"]`,
      { timeout: 15000 },
    );

    const result = await page.evaluate(
      async ({ row, col }: { row: number; col: number }) => {
        const rafTwice = () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          });

        // The intersection is an SVG element — `.click()` isn't on SVGElement
        // (unlike HTMLElement), so dispatch a synthetic MouseEvent.
        function fireClick(el: Element): void {
          const rect = el.getBoundingClientRect();
          const opts: MouseEventInit = {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          };
          el.dispatchEvent(new MouseEvent("pointerdown", opts));
          el.dispatchEvent(new MouseEvent("mousedown", opts));
          el.dispatchEvent(new MouseEvent("pointerup", opts));
          el.dispatchEvent(new MouseEvent("mouseup", opts));
          el.dispatchEvent(new MouseEvent("click", opts));
        }

        const intersect = document.querySelector(
          `[aria-label^="Intersection r${row + 1} c${col + 1}"]`,
        );
        if (!intersect) throw new Error("intersection-target-not-found");

        // Click 1: intersection → face popup appears.
        const t0 = performance.now();
        fireClick(intersect);
        await rafTwice();
        const t1 = performance.now();

        const head = document.querySelector("[data-testid='face-selector-heads']");
        if (!head) {
          return { click1: t1 - t0, click2: Number.NaN, missing: "heads" };
        }

        // Click 2: face → coin lands.
        const t2 = performance.now();
        fireClick(head);
        await rafTwice();
        const t3 = performance.now();

        return { click1: t1 - t0, click2: t3 - t2 };
      },
      { row: TARGET_ROW, col: TARGET_COL },
    );

    return { click1Ms: result.click1, click2Ms: result.click2 };
  } finally {
    await browser.close();
  }
}

async function measureUrl(url: string, label: string): Promise<void> {
  console.info(`\n→ ${label}  (${url})`);
  const c1: number[] = [];
  const c2: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    try {
      const r = await measureOnce(url);
      if (Number.isFinite(r.click1Ms)) c1.push(r.click1Ms);
      if (Number.isFinite(r.click2Ms)) c2.push(r.click2Ms);
      process.stdout.write(".");
    } catch (err) {
      process.stdout.write("x");
      console.error("\nsample error:", err);
    }
  }
  console.info();
  console.info(`  click 1 (intersection → face popup):  ${fmt(stat(c1))}`);
  console.info(`  click 2 (face → coin lands):          ${fmt(stat(c2))}`);
}

async function main(): Promise<void> {
  console.info("PLACE click-to-paint latency — viewport 1280×800, chromium headless");
  console.info(`samples per URL: ${SAMPLES}`);
  await measureUrl(PREVIEW_URL, "prod preview  (NO React Scan)");
  // Dev measurement skipped by default — React Scan headless renders so heavy
  // that chromium hangs on the 3rd sample. Set MEASURE_DEV=1 to include it.
  if (process.env.MEASURE_DEV === "1") {
    await measureUrl(DEV_URL, "dev server    (WITH React Scan)");
  }
  console.info("\nDelta interpretation:");
  console.info("  large dev-vs-preview gap → React Scan instrumentation is the main cost");
  console.info("  similar dev and preview → the bottleneck is real CYCLES code");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
