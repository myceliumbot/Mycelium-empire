# Breakout (HTML5 Canvas)

A small, self-contained Breakout clone you can run locally.

## Quickstart

1. Start a local server from the workspace root:
   - Linux/macOS: `./serve.sh`
   - Or: `python3 -m http.server 8000 --directory /workspace/breakout`
2. Open `http://localhost:8000` in your browser.

## Controls

- Move: Arrow keys, A/D, or Mouse/Touch
- Pause/Resume: Space
- Start: Start button or Space
- Restart: Restart button

## Notes

- The canvas renders at 960x600 and scales to your screen via CSS.
- Each cleared board adds a row (up to 10) and speeds up the ball.