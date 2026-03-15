# turbo-guacamole

A static HTML/CSS/JavaScript **Plinko simulator** with a beach-themed design.

## What it does

- Drops particles automatically from the top of the board.
- Simulates configurable peg rows (4 to 16) where each hit randomly bounces left/right.
- Collects particles into `rows + 1` buckets at the bottom.
- Renders a live bar plot showing the number of particles in each bucket.
- Over time, the histogram trends toward a normal distribution.
- Includes Apply Rows, Pause/Resume, and Reset controls for the simulation.

## Run locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.
