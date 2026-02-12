import { Center, Text3D } from "@react-three/drei";
import { Text } from "three-text/three/react";
import { useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import { state } from "../store";
import { useTexture } from "@react-three/drei";

Text.setHarfBuzzPath("/hb/hb.wasm");

export default function Clock() {
  const {
    isMobile,
    showSettings,
    display,
    bevelSegments,
    bevelOffset,
    bevelThickness,
    textIor,
    textThickness,
    textRoughness,
  } = useSnapshot(state);

  const formatTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [time, setTime] = useState(formatTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <group visible={!showSettings}>
      {display === "grid" && <GridDisplay />}
      {display === "clock" && (
        <>
          {" "}
          <Center key={time} position={[0, isMobile ? 0.3 : 0.2, 0]}>
            <Text3D
              size={isMobile ? 0.7 : 1.2}
              letterSpacing={-0.005}
              height={0.08}
              bevelEnabled
              bevelSize={isMobile ? 0.012 : 0.016}
              bevelSegments={bevelSegments}
              bevelOffset={bevelOffset}
              bevelThickness={bevelThickness}
              font={"/fonts/Morganite_Medium.json"}
            >
              {time}
              <meshPhysicalMaterial
                color="white"
                roughness={textRoughness}
                transmission={1}
                ior={textIor}
                thickness={textThickness}
                reflectivity={0.4}
                clearcoat={0.2}
                clearcoatRoughness={0.1}
                iridescence={1}
                iridescenceIOR={0.9}
                iridescenceThicknessRange={[233, 434]}
                dispersion={12}
              />
            </Text3D>
          </Center>
          <Center
            position={isMobile ? [0.17, 0.2, 0.05] : [0.2, -0.1, 0.05]}
            key={time + "1"}
          >
            <Text
              size={isMobile ? 0.2 : 0.2}
              depth={0}
              font="/fonts/Morganite-ExtraLight.ttf"
              color={[1, 1, 1]}
            >
              APPLE LIQUID GLASS THREEJS
            </Text>

            <Text
              size={isMobile ? 0.08 : 0.08}
              depth={0}
              position={[0.2, 0.15, 0]}
              font="/fonts/Morganite-Medium.ttf"
              color={[1, 1, 1]}
            >
              CREATED BY ANDERSON MANCINI
            </Text>
          </Center>
        </>
      )}
    </group>
  );
}

function GridDisplay() {
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
