# Convert Three.js WebGL to WebGPU with TSL (No Fallback)

## Context

The current project is an "Apple Liquid Glass" demo built with Three.js (WebGL), React Three Fiber v8, and drei v9. It uses custom GLSL shaders, drei's `MeshTransmissionMaterial` (which relies on `onBeforeCompile` GLSL injection), and troika-based `<Text>` (which uses SDF GLSL shaders). The goal is to convert the entire rendering pipeline to Three.js WebGPU using TSL (Three Shading Language), with **no WebGL fallback**, while preserving identical visual output and interactivity.

---

## Step 1: Upgrade Dependencies

**File:** `package.json`

| Package | Current | Target | Reason |
|---------|---------|--------|--------|
| `three` | ^0.169.0 | latest (r175+) | `three/webgpu` and `three/tsl` exports are production-ready since r171 |
| `@react-three/fiber` | 8.17.10 | latest v9 | v9 supports async `gl` prop required for `WebGPURenderer.init()` |
| `@react-three/drei` | 9.115.0 | latest v10 | Required for R3F v9 compatibility |
| `@types/three` | 0.169.0 | match three version | Keep in sync |

**Add new packages:**
| Package | Purpose |
|---------|---------|
| `@three-blocks/core` | Provides `MeshTransmissionNodeMaterial` (WebGPU-compatible drop-in for drei's `MeshTransmissionMaterial`) |
| `three-text` | WebGPU-compatible text rendering with R3F adapter (replaces troika-based `<Text>` from drei) |

**Remove packages (WebGL-only, unused in source):**
- `@react-three/postprocessing`
- `postprocessing`
- `three-custom-shader-material`

```bash
npm install three@latest @react-three/fiber@latest @react-three/drei@latest @types/three@latest @three-blocks/core three-text
npm uninstall @react-three/postprocessing postprocessing three-custom-shader-material
```

---

## Step 2: Update Vite Config

**File:** `vite.config.js`

Add `esnext` build target (required for `top-level await` used by `three/webgpu`) and a resolve alias to prevent duplicate Three.js module instances:

```js
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  resolve: {
    alias: {
      'three': 'three/webgpu',
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
```

---

## Step 3: Convert Canvas to WebGPURenderer

**File:** `src/App.jsx`

- Change `import * as THREE from "three"` to `import * as THREE from "three/webgpu"`
- Add `extend(THREE)` at module level (R3F v9 requirement for WebGPU — registers all Three.js classes as JSX elements)
- Replace `gl` object config with an async factory function that creates `WebGPURenderer`:

```js
const createRenderer = async (props) => {
  const renderer = new THREE.WebGPURenderer({
    ...props,
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    alpha: false,
  });
  await renderer.init();
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.5;
  return renderer;
};
```

- Pass `gl={createRenderer}` and `dpr={[1, 1.5]}` to `<Canvas>`

---

## Step 4: Convert Background Shaders (GLSL to TSL)

**File:** `src/components/BackgroundImageCover.jsx`

This is the most complex conversion. Replace the two `shaderMaterial()` instances (GLSL) with `MeshBasicNodeMaterial` using TSL nodes.

**Remove:** `shaderMaterial` import from drei, `extend()` calls, all GLSL strings
**Add:** imports from `three/tsl` (`Fn`, `texture`, `uniform`, `vec2`, `vec3`, `vec4`, `mix`, `select`, `float`, `positionLocal`, `varying`)

**TSL conversion of the fragment shader:**
- `uniform vec2 viewportResolution` → `uniform(new THREE.Vector2(...))`
- `uniform vec2 videoResolution` → `uniform(new THREE.Vector2(...))`
- `vScreenPos = position.xy` → `varying(positionLocal.xy)`
- Aspect ratio comparison (`if/else`) → `select(condition, trueVal, falseVal)`
- `texture2D(map, uv)` → `texture(textureObj, uvNode)`
- `mix(color, black, factor)` → `mix(texColor.rgb, vec3(0), factor)`
- Assign result to `material.colorNode`

Create a `createCoverMaterial(textureObj, viewportRes, videoRes, darkenAmount)` helper that returns a configured `MeshBasicNodeMaterial` with the TSL fragment logic. Both `VideoBackground` and `ImageBackground` use this helper (darken 0.3 for video, 0.2 for images).

The mesh structure (`<mesh>` + `<planeGeometry>`) stays the same. Attach the material via `material={material}` prop. Expose viewport/video resolution uniforms via refs for dynamic updates.

---

## Step 5: Replace MeshTransmissionMaterial

**File:** `src/components/CustomCursor.jsx`

Replace drei's `<MeshTransmissionMaterial>` (which uses GLSL `onBeforeCompile`, incompatible with WebGPU) with `MeshTransmissionNodeMaterial` from `@three-blocks/core`.

**Remove:** `MeshTransmissionMaterial` import from drei
**Add:** `import { MeshTransmissionNodeMaterial } from "@three-blocks/core"`

Register with R3F via `extend({ MeshTransmissionNodeMaterial })`, then use as JSX:

```jsx
<meshTransmissionNodeMaterial
  color="white"
  metalness={0}
  roughness={textRoughness}
  ior={textIor}
  thickness={textThickness}
  chromaticAberration={0.1}
  clearcoat={0.4}
  clearcoatRoughness={0.05}
  iridescence={0.9}
  iridescenceIOR={0.1}
  iridescenceThicknessRange={[0, 140]}
/>
```

**Property mapping notes:**
- Most props (`color`, `roughness`, `ior`, `thickness`, `clearcoat`, `iridescence`, etc.) map 1:1
- `samples` → may use `ditherStrength`/`ditherScale` instead (check API)
- `resolution` → may not be needed (handled internally)
- `reflectivity` → standard `MeshPhysicalMaterial` prop, should pass through

**Fallback if `@three-blocks/core` doesn't match visually:** Use `THREE.MeshPhysicalNodeMaterial` directly with `transmission: 1`. This uses Three.js's built-in transmission pipeline (auto FBO) but loses chromatic aberration.

Also change `import * as THREE from "three"` to `import * as THREE from "three/webgpu"`.

---

## Step 6: Replace `<Text>` Component (Troika Incompatible with WebGPU)

**Files:** `src/components/Clock.jsx`, `src/components/Settings.jsx`, `src/components/ConfigIcon.jsx`

Troika-three-text (used internally by drei's `<Text>`) is **not compatible with WebGPU** as of early 2026. Replace with `three-text` library which has native WebGPU support and an R3F adapter.

```jsx
import { Text } from "three-text/three/react";
// Initialize HarfBuzz WASM (once, at module level)
Text.setHarfBuzzPath("/hb/hb.wasm");
```

Copy the HarfBuzz WASM file from `node_modules/three-text/hb/hb.wasm` to `public/hb/hb.wasm`.

**API differences from drei's `<Text>`:**
| drei `<Text>` prop | `three-text` equivalent |
|---|---|
| `fontSize={0.1}` | `size={0.1}` |
| `font="fonts/Morganite-Medium.ttf"` | `font="fonts/Morganite-Medium.ttf"` |
| `anchorX="center"` / `anchorY="middle"` | Handle via geometry centering or `planeBounds` |
| `letterSpacing={0.02}` | `layout={{ letterSpacing: 0.02 }}` |
| `color="white"` | Apply via material |
| `{children}` (string) | `{children}` (string) |

Use `depth={0}` for flat text (matching the current SDF flat rendering).

**Fallback approach:** If `three-text` proves too different visually or API-wise, use `<Html>` from drei for UI labels (Settings, ConfigIcon) and keep `<Text3D>` for the Clock subtitle.

---

## Step 7: Update Remaining Components with Import Changes

**Files with `import * as THREE from "three"` that need `"three/webgpu"`:**
- `src/components/AnimateCamera.jsx`
- `src/components/Settings.jsx` (also change `new THREE.MeshPhysicalMaterial()` to `new THREE.MeshPhysicalNodeMaterial()`)

**Files that need NO changes:**
- `src/store.js` (no Three.js imports)
- `src/main.jsx` (no Three.js imports)
- `src/components/ParameterPanel.jsx` (pure HTML)
- `src/components/DynamicLights.jsx` (no THREE import, uses `useFrame` and `easing` only)
- `src/components/Scene.jsx` (`<Environment>` from drei is renderer-agnostic)
- `src/components/LoadingScreen/LoadingScreen.jsx` (pure DOM)
- `src/index.css`, `index.html`

**Components to verify at runtime (should auto-convert via `extend(THREE)`):**
- `<meshBasicMaterial>` → auto-resolves to `MeshBasicNodeMaterial` (ConfigIcon, Clock GridDisplay, Settings)
- `<meshPhysicalMaterial>` → auto-resolves to `MeshPhysicalNodeMaterial` (Clock text)
- `<MeshDiscardMaterial>` from drei → verify it works with WebGPU; if not, replace with a simple material using `discard()` from TSL
- `<directionalLight>` → works with WebGPU
- `<Environment>`, `<OrbitControls>`, `<Billboard>`, `<Center>`, `<Sphere>`, `<Capsule>`, `<Plane>`, `<Circle>` → all geometry/utility components, renderer-agnostic

---

## Step 8: Settings.jsx Material Constructor Update

**File:** `src/components/Settings.jsx`

Change the imperative material creation:
```js
// Before:
new THREE.MeshPhysicalMaterial({ color: "white", transmission: true, ... })

// After:
new THREE.MeshPhysicalNodeMaterial({ color: "white", transmission: 1, ... })
```

Note: `transmission: true` (boolean) may need to become `transmission: 1` (numeric) for `MeshPhysicalNodeMaterial`.

---

## Implementation Order

1. **Dependencies** — upgrade packages, update vite config (Steps 1-2)
2. **App.jsx** — WebGPU renderer setup (Step 3)
3. **Simple import changes** — AnimateCamera.jsx (Step 7)
4. **Standard material components** — Settings.jsx constructor change (Step 8), verify ConfigIcon, Clock grid display
5. **Text replacement** — Clock.jsx, Settings.jsx, ConfigIcon.jsx (Step 6)
6. **Background shader rewrite** — BackgroundImageCover.jsx GLSL→TSL (Step 4)
7. **Transmission material** — CustomCursor.jsx (Step 5)

---

## Verification

After each step, run `npm run dev` and verify in Chrome (WebGPU required):

1. **Renderer check**: Open DevTools console → confirm `THREE.WebGPURenderer` (not `WebGLRenderer`)
2. **Environment**: Warehouse HDR loads, scene has correct ambient lighting
3. **Camera/Controls**: Orbit animation works, camera Y angle slider works, perspective/orthographic switch works
4. **Dynamic Light**: Directional light follows mouse pointer
5. **Background**: All 6 backgrounds (3 videos, 3 images) render with correct aspect-ratio cover effect and darkening
6. **Clock**: 3D time text renders with glass material, grid display shows icons
7. **Text labels**: All UI text (settings labels, button numbers, config icon text) renders correctly
8. **Glass objects**: Sphere, capsule, triangle, and U-shape render with transmission/refraction/iridescence/chromatic aberration
9. **Interactivity**: Drag glass objects, slider works, settings open/close, background switching, parameter panel controls update materials in real-time
10. **Performance**: Compare frame times with original WebGL version — WebGPU should match or exceed

**Browser console checks:**
- No WebGL-related errors
- No GLSL compilation messages (all shaders should compile to WGSL)
- `navigator.gpu` exists and is used

---

## Files Modified Summary

| File | Change | Complexity |
|------|--------|-----------|
| `package.json` | Upgrade deps, add/remove packages | Low |
| `vite.config.js` | Add esnext target, resolve alias | Low |
| `src/App.jsx` | Async WebGPURenderer, extend(THREE) | Medium |
| `src/components/BackgroundImageCover.jsx` | Full rewrite: GLSL→TSL | **High** |
| `src/components/CustomCursor.jsx` | Replace MeshTransmissionMaterial | **High** |
| `src/components/Clock.jsx` | Replace `<Text>` with three-text | Medium |
| `src/components/Settings.jsx` | Replace `<Text>`, update material constructor | Medium |
| `src/components/ConfigIcon.jsx` | Replace `<Text>` with three-text | Low |
| `src/components/AnimateCamera.jsx` | Import path change | Low |
