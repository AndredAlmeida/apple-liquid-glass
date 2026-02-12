import React, { Suspense } from "react";
import { Canvas, extend } from "@react-three/fiber";
import Scene from "./components/Scene";
import AnimateCamera from "./components/AnimateCamera";
import Clock from "./components/Clock";
import BackgroundImageCover from "./components/BackgroundImageCover";
import DynamicLights from "./components/DynamicLights";
import CustomCursor from "./components/CustomCursor";
import * as THREE from "three/webgpu";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import Settings from "./components/Settings";
import ParameterPanel from "./components/ParameterPanel";
import { useSnapshot } from "valtio";
import { state } from "./store";

// Register all Three.js WebGPU classes as JSX elements (required for R3F v9 + WebGPU)
extend(THREE);

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

function App() {
  const { cameraMode } = useSnapshot(state);
  const useOrthographic = cameraMode === "orthographic";

  return (
    <div className="main-container">
      <LoadingScreen />
      <ParameterPanel />
      <Canvas
        key={`camera-${cameraMode}`}
        {...getCanvasProps(useOrthographic)}
      >
        <Suspense fallback={null}>
          <Clock />
          <Settings />
          <Scene />
          <CustomCursor />
          <AnimateCamera />
          <DynamicLights />
          <BackgroundImageCover />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;

const perspectiveCamera = { near: 0.01, far: 1000, fov: 5, position: [0, 0, 25] };
const orthographicCamera = {
  near: 0.01,
  far: 1000,
  zoom: 400,
  position: [0, 0, 25],
};

function getCanvasProps(useOrthographic) {
  return {
    gl: createRenderer,
    dpr: [1, 1.5],
    orthographic: useOrthographic,
    camera: useOrthographic ? orthographicCamera : perspectiveCamera,
  };
}
