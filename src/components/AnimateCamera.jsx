import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useSnapshot } from "valtio";
import { easing } from "maath";
import * as THREE from "three";
import { state as appState } from "../store";

const BASE_CAMERA_DISTANCE = 25;

function AnimateCamera() {
  const orbitControlsRef = useRef();
  const { cameraYAngle, cursorCenterX, cursorCenterY, cursorCenterZ } =
    useSnapshot(appState);

  useFrame((r3fState, delta) => {
    const angleInRadians = THREE.MathUtils.degToRad(
      THREE.MathUtils.clamp(cameraYAngle, -90, 90)
    );
    const cameraRadius = Math.max(0.1, BASE_CAMERA_DISTANCE - cursorCenterZ);
    const desiredPosition = [
      cursorCenterX + Math.sin(angleInRadians) * cameraRadius,
      cursorCenterY,
      cursorCenterZ + Math.cos(angleInRadians) * cameraRadius,
    ];

    easing.damp3(r3fState.camera.position, desiredPosition, 0.25, delta);

    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.set(
        cursorCenterX,
        cursorCenterY,
        cursorCenterZ
      );
      orbitControlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={orbitControlsRef}
      target={[0, 0, 0.1]}
      dampingFactor={0.25}
      maxDistance={25}
      minDistance={20}
      enableRotate={false}
      enableZoom={false}
      enablePan={false}
      minPolarAngle={0.2}
      maxPolarAngle={1.7}
      makeDefault
    />
  );
}

export default AnimateCamera;
