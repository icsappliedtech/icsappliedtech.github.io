# The Words We Use — Jargon Decoder Tool

A self-contained tool that decodes and encodes organizational jargon using the formula system from *The Words We Use* by Jason Weimer.

## Just open it

**Open `index.html` in your browser by double-clicking.** The tool is fully self-contained and works from your desktop, a USB stick, or any folder. Data is embedded directly in the JavaScript so there are no loading issues from local files.

## What's in the box

```
jargon_tool/
├── index.html              ← Main tool page (double-click to run)
├── jargon_data.json        ← All 85 entries (source of truth for edits)
├── sync_data.py            ← Helper script to sync JSON changes into app.js
├── assets/
│   ├── style.css           ← Black/white/gray/yellow design system
│   └── app.js              ← Application logic with embedded data
├── admin/
│   └── index.html          ← Private page for adding new words
└── README.md               ← This file
```

## How to deploy to your website

1. Upload the entire `jargon_tool` folder to mrjasoncode.com
2. Link to `/jargon_tool/index.html` (or rename the folder to something cleaner like `/jargon/`)
3. That's it. No build step. No server code. No dependencies.

## Features

### Decode tab
- Type any of the 85 words and get the formula, components, definition, what it really means, why the formula is shaped that way, and plain-language alternatives
- Each entry shows its own name on the left side of the formula (e.g. `Vision = purpose + ambition + (time + possibility)`)
- Filter by cluster, formula type, or status (core/extended/alternative)
- Live search dropdown as you type
- Quick-pick buttons for common words

### Encode tab
- Enter up to 3 plain-language components
- Pick a formula type and/or cluster (optional)
- Returns top 3 jargon words ranked by component alignment
- Each match shows % alignment and which components matched

### Browse tab
- All 85 words organized by cluster
- Color-coded status dots (core/extended/alternative)
- Click any word to jump to its full entry in Decode tab

### Health Check tab
- Interactive Organizational Health diagnostic using the master formula
- Quick version (5 rapid questions + multiplier)
- Deep version (each component explained in detail)
- Produces a score out of 80 with bar charts per component and a tailored diagnosis

### About tab
- Overview of the six formula types (shown as `j = x + y + z` generic templates)
- The five clusters with their questions

## Adding new jargon words later

### Easiest workflow
1. Open `admin/index.html` in your browser
2. Fill in the form for your new word
3. Click "Generate JSON" and copy the output
4. Open `jargon_data.json` and paste the new entry into the `entries` array (add a comma after the previous entry)
5. Run `python3 sync_data.py` from the jargon_tool folder to update the embedded data
6. Re-upload the files to your site

### Entry structure
```json
{
  "word": "Your Word",
  "cluster": "Direction | People | Resources | Process | Results",
  "status": "core | extended | alternative",
  "formula_type": "Additive | Combination | Exponential | Multiplied | Refinement | Ratio",
  "formula": "Your Word = component1 + component2 + component3",
  "components": ["component1", "component2", "component3"],
  "definition": "Official dictionary-style definition.",
  "what_it_really_means": "The honest version.",
  "why": "Why the formula is shaped this way.",
  "alternatives": ["Plain language alternative 1", "Plain language alternative 2"]
}
```

## Notation system

The tool uses two formula displays:
- **Generic formula types** in the About tab show `j =` as the placeholder (e.g. `j = x + y + z`)
- **Specific word formulas** in each entry show the actual word (e.g. `Vision = purpose + ambition + (time + possibility)`)

The letter `j` stands for jargon — the word being decomposed in the generic template.

## Design

- **Color palette:** black, white, gray, yellow accent (#fbc02d)
- **Typography:** Georgia for headings, system sans for UI, monospace for formulas
- **Fully responsive** — works on phones, tablets, and desktop
- **No tracking, no analytics, no external dependencies** — fully self-contained

## Credit

Built by Jason Weimer. Based on *The Words We Use: The Hidden Formulas Behind Organizational Jargon*.
