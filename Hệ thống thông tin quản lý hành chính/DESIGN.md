# Hanoi Civic Design System (HCDS) — DESIGN.md

## 1. Aesthetic Direction & Institutional Identity
- **Persona:** *Institutional Authority & Civic Clarity* (Uy nghiêm thể chế — Minh bạch công vụ — Tối ưu công thái học).
- **Legal & International Benchmarks:**
  - **Vietnam National Standards:** Nghị định 42/2022/NĐ-CP (citizen-centric IA, 2-tier online service levels *Toàn trình* / *Một phần*, Once-Only principle), Thông tư 21 & 22/2023/TT-BTTTT (3-part portal structure, Quốc huy & full legal entity header/footer, ≤ 3-click rule, TCVN 6909:2001 Vietnamese typography), Quyết định 766/QĐ-TTg (5 real-time pillars: `18 / 20 / 22 / 22 / 18 = 100`), Nghị định 69/2024/NĐ-CP (VNeID readiness), Nghị định 30/2020/NĐ-CP (A4 document typography isolation).
  - **Global GovTech Systems:** UK GOV.UK Design System (*One thing per page*, *Check Answers Summary List*, *Top Error Summary*, *Soft-tint v5 Tags*), U.S. USWDS 3.0 (*Official Trust Banner*, *3-Tier Tokens*, *Summary Box*, *Step Indicator*), Singapore SGDS & MyInfo (*Dual Density Modes*, *Verified Locked Fields*), SAP Fiori / IBM Carbon (*Split-Screen Case Inspection*, *Multi-Cue SLA*, *Four-Eyes Control*).

## 2. Two-World Typography & Numeric Discipline
- **World 1 — Application UI (`--font-sans`, `--font-mono`):**
  - Primary UI Font: `'Be Vietnam Pro'`, self-hosted `.woff2` (`400`, `500`, `600`, `700`), engineered for stacked Vietnamese diacritics.
  - Monospace / Code Font: `'JetBrains Mono'`, self-hosted `.woff2` (`500`, `600`).
  - **Tabular Numerals Mandate:** `font-variant-numeric: tabular-nums` is mandatory on 100% of dossier codes, citizen IDs, dates (`toDate`), SLA countdowns, fees, table counts, and Decision 766 scores.
  - **7-Step Type Scale (Zero `.5px` fractional sizes, minimum `12px`):**
    `12px` (`--text-xs`), `14px` (`--text-sm`), `16px` (`--text-base`), `18px` (`--text-lg`), `20px` (`--text-xl`), `24px` (`--text-2xl`), `30px` (`--text-3xl`).
- **World 2 — Statutory A4 Documents (`--font-legal-serif`):**
  - Quarantined strictly inside `.gov-legal-a4` and print templates (`Mẫu 01` – `Mẫu 06`): `'Times New Roman', 'Tinos', Times, serif` on pure white `#FFFFFF` with `#000000` ink and Decree 30/2020/NĐ-CP margins (`20mm 15mm 20mm 30mm`). Never used in application controls.

## 3. Color Palette & WCAG 2.2 AA Contrast Guarantees
- **Civic Navy (Primary Institutional Anchor):** `#1B365D` (`12.15:1` on white), hover `#122643`, subtle tint `#EDF2F8`.
- **Interactive Civic Blue (Focus & Active Links):** `#0F4C81` (`8.78:1` on white).
- **Heritage Đông Sơn Bronze (Cultural Accent):** `#8C4A27` for text/icons (`6.12:1` on white), `#C58B32` for structural rules/dividers (`border-bottom`), `#FBF6EC` warm surface tint.
- **Sovereign Crimson (Quốc huy / VNeID / Danger / SLA Breach):** `#B42318` (`5.91:1` on white), tint `#FEF3F2`, border `#FECDCA`.
- **Clean Light Surfaces & Borders:**
  - Page Canvas: `#F4F6F9` · Elevated Surface: `#FFFFFF` · Subtle Tint: `#F8FAFC`.
  - Structural Divider: `#CBD5E1` · **Form Control Border:** `#64748B` (`4.76:1` on `#FFFFFF`, exceeding WCAG 1.4.11 `3:1`).
- **5 Semantic Soft-Tint Status Families (GOV.UK v5 Non-Interactive Tags):**
  - `neutral`: bg `#F1F5F9`, border `#CBD5E1`, fg `#334155`
  - `info`: bg `#EFF6FF`, border `#BFDBFE`, fg `#1E40AF`
  - `warning`: bg `#FFFBEB`, border `#FDE68A`, fg `#92400E`
  - `success`: bg `#F0FDF4`, border `#BBF7D0`, fg `#166534`
  - `danger`: bg `#FEF2F2`, border `#FECACA`, fg `#991B1B`

## 4. Spatial Rhythm, Radii, Breakpoints & Anti-Slop Prohibitions
- **Spacing Scale (4pt/8pt Grid):** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`, `64px`.
- **Architectural Border Radii:** `4px` (`--radius-sm` controls/tags), `6px` (`--radius-md` panels), `8px` (`--radius-lg` dialogs). Zero `999px` pill abuse on data containers.
- **4 Canonical Breakpoints:** `640px`, `768px`, `1024px`, `1280px`.
- **Strict Anti-AI-Slop Rules:**
  1. **NO** `border-top: 3px solid` or thick colored accent bars on rounded cards (`[border-accent-on-rounded]` banned).
  2. **NO** `Card-in-Card` double/triple nested bordered boxes; use clean horizontal dividers (`1px solid var(--color-border-subtle)`) inside a single panel.
  3. **NO** ASCII/Unicode pseudo-icons (`☷`, `?`, `⌂`, `i`); use `lucide-react` (`strokeWidth={1.75}`) exclusively with `aria-hidden="true"`.
  4. **NO** decorative `01 / 02 / 03` numbering or ALL-CAPS tracked eyebrow kickers above every heading.
  5. **NO** `outline: none` without a `forced-colors`-safe `2px solid` `:focus-visible` outline, and **NO** `window.confirm()` (use `<dialog>`).
  6. **NO** disjointed headers: exactly **two** unified shells exist across the entire product (`CivicShell` for Citizen routes, `WorkstationShell` for `/staff`).
