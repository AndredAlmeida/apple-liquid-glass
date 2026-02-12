import * as THREE from "three/webgpu";
import { state } from "./store";

function formatValue(value, integer) {
  if (integer) return value;
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

export function setupParameterPanel() {
  const panel = document.getElementById("parameter-panel");
  if (!panel) return;

  // Wire up all slider inputs
  panel.querySelectorAll("input[type='range']").forEach((input) => {
    const key = input.dataset.key;
    const isInteger = input.dataset.integer === "true";
    const valueEl = document.getElementById(`val-${key}`);

    input.addEventListener("input", () => {
      const nextValue = isInteger
        ? parseInt(input.value, 10)
        : Number(input.value);
      state[key] = nextValue;
      if (valueEl) valueEl.textContent = formatValue(nextValue, isInteger);
    });
  });

  // Wire up color input
  const colorInput = panel.querySelector("input[type='color']");
  if (colorInput) {
    colorInput.addEventListener("input", () => {
      state.glassTintColor = colorInput.value;
      const valueEl = document.getElementById("val-glassTintColor");
      if (valueEl) valueEl.textContent = colorInput.value;
    });
  }

  // Wire up all checkboxes by data-key
  panel.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    const key = checkbox.dataset.key;
    checkbox.addEventListener("change", () => {
      state[key] = checkbox.checked;

      // Enable/disable dependent sliders
      if (key === "glassReflectionEnabled") {
        const opacitySlider = panel.querySelector("input[data-key='glassReflectionOpacity']");
        if (opacitySlider) opacitySlider.disabled = !checkbox.checked;
      }
      if (key === "noiseEnabled") {
        const scaleSlider = panel.querySelector("input[data-key='noiseScale']");
        const depthSlider = panel.querySelector("input[data-key='noiseDepth']");
        if (scaleSlider) scaleSlider.disabled = !checkbox.checked;
        if (depthSlider) depthSlider.disabled = !checkbox.checked;
      }
    });
  });

  // Wire up select
  const select = panel.querySelector("select");
  if (select) {
    select.addEventListener("change", () => {
      state.cameraMode = select.value;
      const valueEl = document.getElementById("val-cameraMode");
      if (valueEl) {
        valueEl.textContent = select.value === "perspective" ? "Perspective" : "Orthographic";
      }
    });
  }

}

export function setupLoadingScreen(loadingManager) {
  const wrapper = document.getElementById("loader-wrapper");
  if (!wrapper) return;

  loadingManager.onProgress = (_url, loaded, total) => {
    const progress = Math.floor((loaded / total) * 100);
    document.documentElement.style.setProperty("--progress", progress);
  };

  loadingManager.onLoad = () => {
    document.documentElement.style.setProperty("--progress", 100);

    // Show canvas
    const canvas = document.querySelector("canvas");
    if (canvas) canvas.classList.add("visible");

    // Fade out loader
    wrapper.classList.add("finished-loading");

    // Remove after transition
    setTimeout(() => {
      wrapper.style.display = "none";
    }, 1500);
  };
}

export function createGridDisplay(scene, iconsTexture) {
  const isMobile = state.isMobile;
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    map: iconsTexture,
    transparent: true,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(2.8, 1.55, 1);
  mesh.position.set(0, isMobile ? 0.25 : 0.2, -0.1);
  scene.add(mesh);
  return mesh;
}
