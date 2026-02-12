import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function AnimateCamera() {
  const orbitControlsRef = useRef();
  useFrame(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={orbitControlsRef}
      target={[0, 0, 0]}
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
