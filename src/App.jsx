import React, { Suspense } from "react";
import { Canvas, extend } from "@react-three/fiber";
import {
  PerspectiveCamera,
  OrthographicCamera,
} from "@react-three/drei";
import Scene from "./components/Scene";
import AnimateCamera from "./components/AnimateCamera";
import BackgroundImageCover from "./components/BackgroundImageCover";
import GridDisplay from "./components/GridDisplay";
import DynamicLights from "./components/DynamicLights";
import CustomCursor from "./components/CustomCursor";
import * as THREE from "three/webgpu";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
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

function CameraManager() {
  const { cameraMode } = useSnapshot(state);
  const useOrthographic = cameraMode === "orthographic";

  return (
    <>
      <PerspectiveCamera
        makeDefault={!useOrthographic}
        near={0.01}
        far={1000}
        fov={5}
        position={[0, 0, 25]}
      />
      <OrthographicCamera
        makeDefault={useOrthographic}
        near={0.01}
        far={1000}
        zoom={400}
        position={[0, 0, 25]}
      />
    </>
  );
}

function App() {
  return (
    <div className="main-container">
      <LoadingScreen />
      <ParameterPanel />
      <Canvas
        gl={createRenderer}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <CameraManager />
          <GridDisplay />
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
