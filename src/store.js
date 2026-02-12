import { proxy } from "valtio";

const state = proxy({
  isMobile: window.innerWidth < 768,
  finishedLoadingAsset: false,
  hovered: false,
  showSettings: false,
  background: "video3",
  reflectivity: 0.45,
  isDragging: false,
  display: "grid",
  bevelSegments: 8,
  bevelOffset: 0,
  bevelThickness: 0.03,
  textIor: 1.8,
  textThickness: 2,
  textRoughness: 0.23,
  extrudeDepth: 1,
  sampleSize: "medium",
  cameraMode: "perspective",
  cameraYAngle: 0,
  cursorCenterX: 0,
  cursorCenterY: 0,
  cursorCenterZ: 0.1,
});

export { state };
