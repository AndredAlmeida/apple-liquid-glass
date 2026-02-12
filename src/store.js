import { proxy } from "valtio/vanilla";

const state = proxy({
  isMobile: window.innerWidth < 768,
  background: "video3",
  reflectivity: 0.45,
  glassReflectionEnabled: true,
  glassReflectionOpacity: 0.05,
  isDragging: false,
  bevelSegments: 20,
  bevelOffset: -0.023,
  bevelThickness: 0.056,
  textIor: 2.5,
  textThickness: 0.27,
  textRoughness: 0,
  extrudeDepth: 1.5,
  glassTintColor: "#ffffff",
  cameraMode: "perspective",
  noiseEnabled: false,
  noiseScale: 5,
  noiseDepth: 0,
  cameraYAngle: 0,
});

export { state };
