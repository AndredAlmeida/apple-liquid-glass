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
  textIor: 1.8,
  textThickness: 2,
  textRoughness: 0.23,
});

export { state };
