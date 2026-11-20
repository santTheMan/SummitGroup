/**
 * Which logo artwork the site is using.
 *
 * 'interim': transparent 4K PNGs from the SGI brand pack emailed on 18 Nov 2026.
 *            Same lockup and icon, but not the final vector files.
 * 'final':   SVGs from SGI Brand Pack v1.0 (20 Nov 2026), for example
 *            01 Logo/Horizontal lockup (website header, documents)/SGI-lockup-reversed.svg.
 *
 * To finish the swap: add the v1.0 SVGs to src/assets/brand/, update the
 * imports in src/components/Logo.astro and src/components/Businesses.astro,
 * rerun scripts/brand/build-icons.py, then set this to 'final'.
 */
export const brandAssetStatus: 'interim' | 'final' = 'interim';
