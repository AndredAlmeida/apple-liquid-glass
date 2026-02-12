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

No linting, testing, or TypeScript — pure JSX/JavaScript project.

## Architecture

### Rendering Pipeline

- **WebGPURenderer** created asynchronously via `createRenderer()` factory in `App.jsx`
- All Three.js imports use `three/webgpu` (not `three`) — this is critical
- TSL shaders use imports from `three/tsl` (`Fn`, `texture`, `uniform`, `vec2`, etc.)
- R3F v9 requires `extend(THREE)` at module level to register Three.js classes as JSX elements
- Vite target is `esnext` (required for top-level await in WebGPU init)

### State Management

Valtio proxy in `src/store.js` — direct mutation triggers reactive re-renders via `useSnapshot()`. Controls material parameters, background selection, camera mode, display mode, and UI state.

### Key Components

- **App.jsx** — Root: async WebGPURenderer setup, camera config (perspective/orthographic)
- **CustomCursor.jsx** — Most complex: 4 draggable glass objects (sphere, capsule, triangle, U-shape) using `MeshPhysicalMaterial` with transmission. Geometry created with `ExtrudeGeometry` + configurable bevels. Drag via raycasting to z=0.1 plane
- **BackgroundImageCover.jsx** — TSL shader for aspect-ratio-correct background covering (like CSS `background-size: cover`). Uses `MeshBasicNodeMaterial` with `.colorNode` assignment. Supports images and video textures
- **Clock.jsx** — 3D glass time display using `<Text3D>` from drei with iridescence/refraction
- **Settings.jsx** — 3D UI with background/display option buttons using `Sphere` primitives with `MeshPhysicalNodeMaterial`
- **ParameterPanel.jsx** — DOM-based control panel (sliders/selects for material params)
- **Scene.jsx** — Environment setup (warehouse HDR preset via `useEnvironment()`)
- **AnimateCamera.jsx** — Camera follows `cursorCenter` state with easing, OrbitControls
- **DynamicLights.jsx** — Directional light follows mouse pointer with easing

### Material Pattern

Glass materials use `MeshPhysicalMaterial` (auto-mapped to `MeshPhysicalNodeMaterial` via `extend(THREE)`) with `transmission: 1`, configurable `ior`, `thickness`, `roughness`, `iridescence`, `dispersion`, and `clearcoat`.

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

## Migration Context

The WebGL-to-WebGPU migration is complete (see `PLAN.md` for the 8-step migration plan). Current branch `apple-liquid-glass-TSL-polishing` is in the refinement phase.
