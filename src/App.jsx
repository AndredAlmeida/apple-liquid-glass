import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import AnimateCamera from "./components/AnimateCamera";
import Clock from "./components/Clock";
import BackgroundImageCover from "./components/BackgroundImageCover";
import DynamicLights from "./components/DynamicLights";
import CustomCursor from "./components/CustomCursor";
import * as THREE from "three";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import Settings from "./components/Settings";
import ParameterPanel from "./components/ParameterPanel";
import { useSnapshot } from "valtio";
import { state } from "./store";

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

const baseCanvasProps = {
  gl: {
    antialias: true,
    powerPreference: "high-performance",
    toneMappingExposure: 1.5,
    stencil: false,
    alpha: false,
    toneMapping: THREE.NeutralToneMapping,
  },
  dpr: [1, 1.5],
};

const perspectiveCamera = { near: 0.01, far: 1000, fov: 5, position: [0, 0, 25] };
const orthographicCamera = {
  near: 0.01,
  far: 1000,
  zoom: 400,
  position: [0, 0, 25],
};

function getCanvasProps(useOrthographic) {
  return {
    ...baseCanvasProps,
    orthographic: useOrthographic,
    camera: useOrthographic ? orthographicCamera : perspectiveCamera,
  };
}
