import {
  Circle,
  MeshDiscardMaterial,
  Plane,
  Center,
  useTexture,
} from "@react-three/drei";
import { Text } from "three-text/three/react";
import { useSnapshot } from "valtio";
import { state } from "../store";

Text.setHarfBuzzPath("/hb/hb.wasm");

export default function ConfigIcon() {
  const texture = useTexture("/config-icon.png");

  const { hovered, isMobile, showSettings } = useSnapshot(state);

  return (
    <group position={[0, isMobile ? 0.15 : 0, 0.0]}>
      <Plane
        args={[0.6, 0.35]}
        onPointerEnter={() => (state.hovered = true)}
        onPointerLeave={() => (state.hovered = false)}
        onClick={() => (state.showSettings = !state.showSettings)}
        position={[0, -0.9, 0]}
      >
        <MeshDiscardMaterial />
      </Plane>
      <Circle
        args={[0.1, 8, 8]}
        position={[hovered ? -0.2 : 0, -0.9, 0]}
        visible={!showSettings}
      >
        <meshBasicMaterial map={texture} transparent />
      </Circle>

      <group visible={hovered || showSettings}>
        <Center
          position={showSettings ? [0, -0.915, 0] : [0.03, -0.915, 0]}
        >
          <Text
            size={0.1}
            depth={0}
            font="/fonts/Morganite-Medium.ttf"
            color={[1, 1, 1]}
          >
            {showSettings ? "CLOSE SETTINGS" : "OPEN SETTINGS"}
          </Text>
        </Center>
      </group>
    </group>
  );
}
