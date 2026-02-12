import { useTexture } from "@react-three/drei";
import { useSnapshot } from "valtio";
import { state } from "../store";

export default function GridDisplay() {
  const { isMobile } = useSnapshot(state);
  const iconsTexture = useTexture("/icons.png");

  return (
    <mesh
      scale={[2.8, 1.55, 1]}
      position={isMobile ? [0, 0.25, -0.1] : [0, 0.2, -0.1]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={iconsTexture} transparent toneMapped={false} />
    </mesh>
  );
}
