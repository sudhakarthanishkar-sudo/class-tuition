# Design Brief

## Direction

Warm Chalk — a peach-paper attendance ledger that feels like a well-kept notebook, not a spreadsheet.

## Tone

Soft/pastel executed with conviction: rounded, tactile, low-contrast paper surfaces with one deep plum ink for action and one sharp apricot for emphasis.

## Differentiation

The peach is the canvas, not the button — warm off-white paper cards float on a peach field, and a deep plum primary keeps every action legible and confident instead of washing out.

## Color Palette

| Token      | OKLCH          | Role                                            |
| ---------- | -------------- | ----------------------------------------------- |
| background | 0.955 0.026 62 | Peach paper canvas for every screen             |
| foreground | 0.235 0.042 40 | Warm near-black ink for all text                |
| card       | 0.992 0.008 78 | Warm off-white paper surface for rows and forms |
| primary    | 0.405 0.155 330 | Deep plum ink — primary buttons, active tab bar |
| accent     | 0.68 0.185 50  | Apricot — today marker, focus ring, highlights  |
| muted      | 0.928 0.022 62 | Recessed peach for chips, empty states, inputs  |
| success    | 0.62 0.15 155  | Present status                                  |
| destructive | 0.545 0.215 25 | Absent status + swipe-revealed delete           |
| warning    | 0.775 0.14 85  | Class Cancelled status                          |

## Typography

- Display: Nunito — rounded, warm headings ("Hello Thanishkar", subject names, sheet titles)
- Body: Figtree — UI labels, dates, buttons, form fields, list rows
- Mono: Geist Mono — date numerals and counters only, for ledger precision
- Scale: hero `text-4xl md:text-5xl font-extrabold tracking-tight`, h2 `text-xl font-bold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm md:text-base`

## Elevation & Depth

Two soft warm shadows only — `shadow-subtle` for resting cards and `shadow-elevated` for sheets/dialogs; the floating Add Subjects button gets the plum `shadow-float` so it reads as the single raised object on the page.

## Structural Zones

| Zone         | Background            | Border                   | Notes                                                         |
| ------------ | --------------------- | ------------------------ | ------------------------------------------------------------- |
| Login        | `bg-gradient-peach`   | —                        | Centered paper card, plum sign-in button, no nav              |
| App header   | `bg-background`       | none                     | Greeting block sits directly on peach, no bar                 |
| Subject tabs | `bg-card` pill rail   | `border-border`          | Horizontal scroll, each pill tinted by its subject colour      |
| Content      | `bg-background`       | —                        | Peach field; each subject row is a `bg-card` paper card        |
| Detail view  | `bg-background`       | —                        | Sticky "Mark today" card in `bg-card`, then date list          |
| Footer / nav | `bg-card`             | `border-t`               | Fixed bottom bar; Add Subjects FAB floats above bottom-right   |

## Spacing & Rhythm

Generous 1rem card padding with 0.75rem gaps between list rows; section breaks use 2rem (`space-y-8`), micro-spacing inside chips and status buttons is 0.5rem.

## Component Patterns

- Buttons: fully rounded pills; plum `bg-primary` for main actions, `bg-card` + border for secondary, status buttons tinted with their status colour at 14–20% alpha
- Cards: `radius-card` (22px) warm off-white paper with `shadow-subtle`; swiping right reveals a solid red destructive panel behind the card
- Badges: pill chips — Present green, Absent red, Class Cancelled amber, each on a 14–20% tint of its own hue
- Subject tab: pill with a filled colour dot from the user's chosen colour plus the subject name; active tab gets a 2px plum underline

## Motion

- Entrance: page content and list rows `animate-rise` (320ms, translateY 10px, ease-out) staggered ~40ms
- Hover: `transition-smooth` on cards, tabs and buttons — lift to `shadow-elevated` and scale 1.01
- Decorative: FAB `animate-fab-pop` on mount, sheets `animate-sheet-in`, swipe reveal uses a 200ms transform transition

## Constraints

- Never use raw hex/rgb or arbitrary colour classes — semantic tokens only
- Peach is the page field; cards are warm off-white, never peach-on-peach
- No attendance percentage, streak, or monthly overview surfaces — out of scope
- Colour per subject comes from user input and is applied only as a dot/tint, never as a token override
- Mobile-first: single column, thumb-reachable actions, 44px minimum touch targets

## Signature Detail

A soft dotted "notebook rule" hairline above each date group, and the plum floating Add Subjects pill — the one saturated object on an otherwise quiet peach page.
