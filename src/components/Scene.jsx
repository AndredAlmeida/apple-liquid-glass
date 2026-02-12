import { useEffect } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import * as THREE from "three/webgpu";

function Scene() {
  const envMap = useLoader(RGBELoader, "/empty_warehouse_01_1k.hdr");
  envMap.mapping = THREE.EquirectangularReflectionMapping;

  const scene = useThree((state) => state.scene);

  useEffect(() => {
    scene.environment = envMap;
    scene.environmentIntensity = 0.25;
    return () => {
      scene.environment = null;
    };
  }, [envMap, scene]);

  return null;
}

export default Scene;
