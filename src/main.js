import * as THREE from "three/webgpu";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { subscribe } from "valtio/vanilla";
import { state } from "./store";
import {
  setupCameras,
  updateCameraAspect,
  setupEnvironment,
  setupControls,
  setupLights,
  animateCamera,
  animateLight,
} from "./scene";
import {
  createBackground,
  setupBackgroundSwitching,
  updateBackgroundSize,
} from "./background";
import { createGlassObjects, setupDragInteraction } from "./glassObjects";
import { setupParameterPanel, setupLoadingScreen, createGridDisplay } from "./ui";
import "./index.css";

const DEG2RAD = Math.PI / 180;

function computeViewport(camera) {
  if (camera.isPerspectiveCamera) {
    const distance = camera.position.z;
    const vFov = camera.fov * DEG2RAD;
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * camera.aspect;
    return { width, height };
  }
  // Orthographic
  return {
    width: (camera.right - camera.left) / camera.zoom,
    height: (camera.top - camera.bottom) / camera.zoom,
  };
}

async function init() {
  // --- Renderer ---
  const renderer = new THREE.WebGPURenderer({
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    alpha: false,
  });
  await renderer.init();
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const root = document.getElementById("root");
  root.insertBefore(renderer.domElement, root.firstChild);

  // --- Loading ---
  const loadingManager = new THREE.LoadingManager();
  setupLoadingScreen(loadingManager);

  const textureLoader = new THREE.TextureLoader(loadingManager);
  const rgbeLoader = new RGBELoader(loadingManager);

  // --- Scene ---
  const scene = new THREE.Scene();

  // --- Cameras ---
  const cameras = setupCameras();
  let activeCamera = cameras.perspective;

  // --- Load assets ---
  const envMap = await new Promise((resolve, reject) => {
    rgbeLoader.load("/empty_warehouse_01_1k.hdr", resolve, undefined, reject);
  });
  envMap.mapping = THREE.EquirectangularReflectionMapping;

  const iconsTexture = await new Promise((resolve, reject) => {
    textureLoader.load("/icons.png", resolve, undefined, reject);
  });

  // --- Environment ---
  setupEnvironment(scene, envMap);

  // --- Controls ---
  let controls = setupControls(activeCamera, renderer.domElement);

  // --- Lights ---
  const light = setupLights(scene);

  // --- Viewport ---
  let viewportSize = computeViewport(activeCamera);

  // --- Background ---
  createBackground(scene, viewportSize);
  // Use a separate texture loader (without loading manager) for background switching
  // so swapping backgrounds doesn't re-trigger the loading screen
  const bgTextureLoader = new THREE.TextureLoader();
  setupBackgroundSwitching(scene, viewportSize, bgTextureLoader);

  // --- Grid display ---
  createGridDisplay(scene, iconsTexture);

  // --- Glass objects ---
  const glassGroup = createGlassObjects(scene, envMap);
  setupDragInteraction(glassGroup, activeCamera, renderer.domElement);

  // --- Camera mode switching ---
  let prevCameraMode = state.cameraMode;
  subscribe(state, () => {
    if (state.cameraMode !== prevCameraMode) {
      prevCameraMode = state.cameraMode;
      activeCamera = state.cameraMode === "orthographic"
        ? cameras.orthographic
        : cameras.perspective;

      controls.dispose();
      controls = setupControls(activeCamera, renderer.domElement);

      // Rebuild drag interaction with new camera
      setupDragInteraction(glassGroup, activeCamera, renderer.domElement);

      viewportSize = computeViewport(activeCamera);
      updateBackgroundSize(viewportSize);
    }
  });

  // --- Resize ---
  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    updateCameraAspect(cameras, w, h);
    viewportSize = computeViewport(activeCamera);
    updateBackgroundSize(viewportSize);
    state.isMobile = w < 768;
  });

  // --- Pointer tracking for light ---
  const pointer = { x: 0, y: 0 };
  renderer.domElement.addEventListener("pointermove", (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  });

  // --- Parameter panel ---
  setupParameterPanel();

  // --- Animation loop ---
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();

    animateCamera(activeCamera, controls, delta);
    animateLight(light, pointer, delta);

    renderer.render(scene, activeCamera);
  });
}

init().catch((err) => {
  console.error("Failed to initialize WebGPU:", err);
  document.body.innerHTML = `<div style="color:white;padding:2rem;font-family:sans-serif;">
    <h2>WebGPU is not supported</h2>
    <p>This demo requires a browser with WebGPU support (Chrome 113+, Edge 113+, Safari 18+).</p>
    <p>Error: ${err.message}</p>
  </div>`;
});
