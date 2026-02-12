# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fork of the Apple Liquid Glass demo, ported from WebGL to **WebGPU using TSL (Three Shading Language)**. No WebGL fallback. Interactive 3D glass objects with transmission, refraction, and iridescence effects.

Live: https://appleliquidglass.vercel.app

## Commands

```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
npm run deploy   # Deploy to Vercel production
```

No linting, testing, or TypeScript — pure vanilla JavaScript project (no React).

## Architecture

### Rendering Pipeline

- **WebGPURenderer** created asynchronously in `main.js`
- All Three.js imports use `three/webgpu` (not `three`) — this is critical
- TSL shaders use imports from `three/tsl` (`Fn`, `texture`, `uniform`, `vec2`, etc.)
- Vite target is `esnext` (required for top-level await in WebGPU init)

### State Management

Valtio proxy in `src/store.js` — uses `valtio/vanilla` (no React). Direct mutation triggers `subscribe()` callbacks. Controls material parameters, background selection, camera mode, and UI state.

### File Structure

- **main.js** — Entry point: creates renderer, loads assets, sets up scene, starts animation loop
- **store.js** — Valtio proxy state (material params, camera mode, background, drag state)
- **scene.js** — Cameras (perspective/orthographic), OrbitControls, lights, animation functions (camera easing, light following pointer)
- **background.js** — TSL shader for aspect-ratio-correct background covering (`MeshBasicNodeMaterial` with `.colorNode`). Supports images and video textures
- **glassObjects.js** — 4 draggable glass meshes (sphere, capsule, triangle, U-shape) using `MeshPhysicalMaterial` with transmission. Geometry via `ExtrudeGeometry` + configurable bevels. Drag via raycasting to z=0.1 plane
- **ui.js** — DOM-based parameter panel wiring, loading screen, grid display
- **index.css** — All styles including loading screen

### Material Pattern

Glass materials use `MeshPhysicalMaterial` with `transmission: 1`, configurable `ior`, `thickness`, `roughness`, `iridescence`, `dispersion`, and `clearcoat`.

### TSL Shader Pattern

Custom shaders compose functional nodes instead of GLSL strings:
- `Fn()` wraps fragment logic returning `vec4`
- `uniform()` creates uniforms, `varying()` passes data between stages
- `select()` replaces `if/else`, `mix()` for interpolation
- Result assigned to `material.colorNode`

## WebGPU Requirements

- Browser must support WebGPU (Chrome/Edge 113+, Safari 18+)
- Verify in console: `navigator.gpu` should exist, no WebGL/GLSL errors
- All shaders compile to WGSL, never GLSL
