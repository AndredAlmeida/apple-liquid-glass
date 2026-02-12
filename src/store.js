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
  bevelSegments: 20,
  bevelOffset: -0.023,
  bevelThickness: 0.056,
  textIor: 2.5,
  textThickness: 0.27,
  textRoughness: 0,
  extrudeDepth: 1.5,
  sampleSize: "medium",
  cameraMode: "perspective",
  cameraYAngle: 0,
  cursorCenterX: 0,
  cursorCenterY: 0,
  cursorCenterZ: 0.1,
});

export { state };
