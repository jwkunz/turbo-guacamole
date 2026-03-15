# turbo-guacamole

A static HTML/CSS/JavaScript **Plinko simulator** with a beach-themed design.

## What it does

- Drops particles automatically from the top of the board.
- Simulates 10 rows of pegs where each hit randomly bounces left/right.
- Collects particles into 11 buckets at the bottom.
- Renders a live bar plot showing the number of particles in each bucket.
- Over time, the histogram trends toward a normal distribution.
- Includes Pause/Resume and Reset controls for the simulation.

## Run locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.
