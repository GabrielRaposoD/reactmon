# Reactmon

A browser-based recreation of Pokémon Generation 1, built with React and TypeScript.

Single-player, client-side only — no backend, no server, no database.

## Tech Stack

- **Vite + React 19 + TypeScript** — scaffolding and build
- **PixiJS 8 + @pixi/react 8** — canvas-based game rendering (WebGL/WebGPU)
- **Zustand** — state management, split by domain
- **Vitest** — unit testing for pure logic modules

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `pnpm dev`     | Start development server |
| `pnpm build`   | Production build         |
| `pnpm test`    | Run unit tests           |
| `pnpm preview` | Preview production build |

## Project Structure

```
src/
  engine/       Core game engine (loop, input, scenes, camera, sprite sheets)
  data/         Static JSON data files and TypeScript types
  systems/      Isolated game systems (overworld, battle, pokemon, etc.)
  stores/       Zustand stores
  scenes/       Scene components (React + PixiJS)
  components/   Reusable React DOM UI components
  hooks/        Custom React hooks
  utils/        Shared utility functions
  tests/        Vitest unit tests
public/
  assets/       Game assets (sprites, tilesets, maps)
```

## Legal & Credits

This is an unofficial, non-commercial fan project for educational and personal
use only. It is **not affiliated with, endorsed by, or connected to Nintendo,
Game Freak, Creatures Inc., or The Pokémon Company**.

### Game Assets

All graphical assets (sprites, tilesets, map data) under `public/assets/` are
the intellectual property of **Nintendo**, **Game Freak**, and **Creatures Inc.**

> Pokémon © Nintendo / Game Freak / Creatures Inc.

Assets were sourced from the [pokeyellow disassembly](https://github.com/pret/pokeyellow)
by the [pret](https://github.com/pret) community — a volunteer reverse-engineering effort.
Full attribution details in [ASSETS_NOTICE.md](ASSETS_NOTICE.md).

### Source Code

The original source code of this project is licensed under the
[MIT License](LICENSE).

**Do not use the game assets for any commercial purpose.**
