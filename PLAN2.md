# Plan: Remove React — Convert to Vanilla Three.js + TSL

## Context

The project is an Apple Liquid Glass demo currently built with React, React Three Fiber (R3F), and drei. The goal is to strip out React entirely and have a clean, simple Three.js project with TSL support. The existing rendering logic (TSL shaders, material configs, geometry creation) is already mostly vanilla Three.js — React is just the glue layer.

## Files to Delete

All current `src/` files except `store.js` and `index.css`:
- `src/main.jsx`
- `src/App.jsx`
- `src/components/Scene.jsx`
- `src/components/CustomCursor.jsx`
- `src/components/BackgroundImageCover.jsx`
- `src/components/GridDisplay.jsx`
- `src/components/AnimateCamera.jsx`
- `src/components/DynamicLights.jsx`
- `src/components/ParameterPanel.jsx`
- `src/components/LoadingScreen/LoadingScreen.jsx`
- `src/components/LoadingScreen/loadingScreen.css`

## New File Structure

```
src/
  main.js           — Entry point: init renderer, load assets, start loop
  store.js           — Keep as-is (valtio proxy, works without React)
  scene.js           — Scene, environment, cameras, controls, lights
  background.js      — Background image/video with TSL cover shader
  glassObjects.js    — Glass meshes (sphere, capsule, triangle, U-shape) + drag
  ui.js              — Parameter panel + loading screen (DOM event wiring)
  index.css          — Keep as-is
```

## Packages to Remove

```
react, react-dom, @react-three/fiber, @react-three/drei,
@vitejs/plugin-react, @types/three, @types/react, @types/react-dom,
r3f-perf, three-text, gsap, leva, @radial-color-picker/react-color-picker, vercel
```

## Packages to Keep

```
three (^0.182.0), maath (^0.10.8), valtio (^2.1.1), vite (^5.4.10)
```

---

## Implementation Steps

### Step 1: Update config files

**`vite.config.js`** — Remove react plugin, keep esnext target.

**`package.json`** — Remove all unused deps. Change `main.jsx` to `main.js` in scripts if needed.

**`index.html`** — Change script src from `/src/main.jsx` to `/src/main.js`. Add loading screen HTML and parameter panel HTML directly (moved out of JSX). Update meta descriptions to remove "React Three Fiber" references.

### Step 2: `src/store.js` — Minimal changes

Keep valtio proxy as-is. Remove `finishedLoadingAsset` (unused). The `subscribe()` function from valtio will be used instead of `useSnapshot()` for reacting to state changes.

### Step 3: `src/main.js` — Entry point

Replaces `main.jsx` and `App.jsx`. Responsibilities:
- Create `WebGPURenderer` (reuse existing `createRenderer` async pattern)
- Create `THREE.Scene`
- Create both cameras (perspective + orthographic), set initial active camera
- Set up `window.resize` handler (update renderer size, camera aspect/projection, notify background)
- Create a shared `THREE.LoadingManager` for progress tracking
- Load all assets (HDR env map, textures, video) via the loading manager
- Once loaded: init scene objects by calling setup functions from other modules
- Start render loop via `renderer.setAnimationLoop()`
- The render loop: update controls, animate camera, animate light, render

### Step 4: `src/scene.js` — Scene setup

Exports functions called from `main.js` after assets are loaded:
- `setupEnvironment(scene, envMap)` — set `scene.environment`, `scene.environmentIntensity`
- `setupCameras()` — create and return perspective + orthographic cameras
- `setupControls(camera, domElement)` — create `OrbitControls` from `three/addons/controls/OrbitControls.js` with same config as current AnimateCamera (rotation/zoom/pan disabled)
- `setupLights(scene)` — create directional light, add to scene, return ref
- `animateCamera(camera, controls, delta)` — easing.damp3 logic from AnimateCamera.jsx, reads `state.cameraYAngle` and `state.cursorCenter*`
- `animateLight(light, pointer, delta)` — easing.damp3 logic from DynamicLights.jsx
- Subscribe to `state.cameraMode` changes to swap active camera

### Step 5: `src/background.js` — Background plane + TSL shader

Reuse `createCoverMaterial()` almost verbatim from `BackgroundImageCover.jsx` — it's already pure Three.js/TSL.

Exports:
- `createBackground(scene, viewport)` — creates plane mesh, initial material, adds to scene
- `setBackgroundImage(texture, viewport)` — swap to image material
- `setBackgroundVideo(videoTexture, viewport)` — swap to video material
- `updateBackgroundSize(viewport)` — called on resize

Subscribe to `state.background` changes to switch between image/video textures. Load textures/videos in `main.js` and pass them in.

### Step 6: `src/glassObjects.js` — Glass meshes + drag interaction

Port from `CustomCursor.jsx`. The geometry creation functions (`createRoundedTriangleShape`, `createUShape`) are already pure Three.js — copy as-is.

Exports:
- `createGlassObjects(scene, envMap)` — creates group with 4 meshes (sphere, capsule, triangle, U-shape), adds to scene, returns group ref
- `setupDragInteraction(group, camera, domElement)` — manual `THREE.Raycaster` + pointer event listeners on the canvas for drag-to-plane logic. Replaces R3F's automatic pointer event system.
- Internal: subscribe to geometry-affecting state changes (`bevelSegments`, `bevelOffset`, `bevelThickness`, `extrudeDepth`) to recreate geometries (dispose old, create new)
- Internal: subscribe to material-affecting state changes (`textIor`, `textThickness`, `textRoughness`, `glassTintColor`, `reflectivity`, `glassReflectionEnabled`, `glassReflectionOpacity`) to update material properties

For drag: listen to `pointerdown`, `pointermove`, `pointerup` on the canvas element. On pointerdown, raycast against the 4 meshes. If hit, start drag mode using the same `THREE.Plane(new THREE.Vector3(0, 0, 1), -0.1)` intersection logic.

### Step 7: `src/ui.js` — DOM UI wiring

**Parameter Panel**: The HTML will be in `index.html`. This module queries DOM elements and wires up `input`/`change` event listeners that mutate `state.*`. Subscribe to state changes to update displayed values.

**Loading Screen**: Query the loader wrapper element. Use the `THREE.LoadingManager` onProgress callback to update `--progress` CSS variable. On load complete, add `finished-loading` class and remove the overlay after transition.

**Grid display (icons)**: Create a simple plane mesh with the icons texture, add to scene. This is straightforward — `new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: iconsTexture, transparent: true }))` with the same scale/position as current.

### Step 8: `index.html` — Add DOM elements

Move the loading screen HTML and parameter panel HTML from JSX into `index.html` directly. The loading screen SVG markup and parameter panel form elements become static HTML. The `ui.js` module wires them up.

### Step 9: Cleanup

- Delete `src/components/` directory entirely
- Delete `src/main.jsx`, `src/App.jsx`
- Remove React-related entries from `.gitignore` if any
- Run `npm install` to update lockfile after removing packages
- Verify `npm run dev` and `npm run build` work

---

## Key Patterns for the Conversion

**State reactivity** — Use `subscribe(state, callback)` from valtio to react to changes. For material properties, subscribe and update `material.ior = state.textIor` etc. directly.

**Pointer tracking** — Track normalized pointer position (`-1 to 1`) via `pointermove` on canvas for the dynamic light animation (replaces R3F's `state.pointer`).

**Render loop** — Single `renderer.setAnimationLoop((time) => { ... })` in main.js. Call animate functions from scene.js, then `renderer.render(scene, activeCamera)`.

**Viewport** — Calculate viewport dimensions in world units for the background plane sizing. On resize: update renderer, cameras, background plane scale, and material uniforms.

---

## Verification

1. `npm run dev` starts without errors
2. Glass objects render with transmission/refraction/iridescence
3. Drag interaction works on all 4 objects
4. Background images and videos display correctly with cover aspect ratio
5. Parameter panel sliders update materials in real-time
6. Camera mode toggle (perspective/orthographic) works without losing env map
7. Icons grid displays correctly
8. Loading screen shows progress and fades out
9. `npm run build` succeeds
10. No React imports remain anywhere in source
