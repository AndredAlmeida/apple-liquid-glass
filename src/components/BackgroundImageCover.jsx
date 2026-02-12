import { useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture, useVideoTexture } from "@react-three/drei";
import * as THREE from "three/webgpu";
import {
  Fn,
  texture,
  uniform,
  vec2,
  vec3,
  vec4,
  mix,
  select,
  float,
  positionLocal,
  varying,
} from "three/tsl";
import { useSnapshot } from "valtio";
import { state } from "../store";

function createCoverMaterial(mapTexture, viewportRes, videoRes, darkenAmount) {
  const viewportResolution = uniform(viewportRes, "vec2");
  const videoResolution = uniform(videoRes, "vec2");

  // Pass vertex position.xy as a varying to the fragment stage
  const vScreenPos = varying(positionLocal.xy, "vScreenPos");

  // TSL fragment logic equivalent to the original GLSL
  const coverFragment = Fn(() => {
    // Calculate aspect ratios
    const viewportAspect = viewportResolution.x.div(viewportResolution.y);
    const videoAspect = videoResolution.x.div(videoResolution.y);

    // Convert screen position [-1,1] to normalized UV [0,1]
    const screenUV = vScreenPos.add(1.0).mul(0.5).toVar("screenUV");

    // Condition: video wider than viewport
    const videoIsWider = videoAspect.greaterThan(viewportAspect);

    // Calculate scale for each case
    const scale = select(
      videoIsWider,
      viewportAspect.div(videoAspect),
      videoAspect.div(viewportAspect)
    );

    // Apply scaling to the appropriate axis
    // When video is wider: scale X, offset X by (1-scale)*0.5
    // When video is taller: scale Y, offset Y by (1-scale)*0.25
    const scaledX = select(
      videoIsWider,
      screenUV.x.mul(scale).add(float(1.0).sub(scale).mul(0.5)),
      screenUV.x
    );

    const scaledY = select(
      videoIsWider,
      screenUV.y,
      screenUV.y.mul(scale).add(float(1.0).sub(scale).mul(0.25))
    );

    const finalUV = vec2(scaledX, scaledY).clamp(0.0, 1.0);

    // Sample texture at computed UV
    const texColor = texture(mapTexture, finalUV);

    // Darken by mixing with black
    const finalColor = mix(texColor.rgb, vec3(0.0, 0.0, 0.0), darkenAmount);

    return vec4(finalColor, 1.0);
  });

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = coverFragment();
  material.depthWrite = false;

  // Expose uniforms for external updates
  material._viewportResolution = viewportResolution;
  material._videoResolution = videoResolution;

  return material;
}

function VideoBackground({ videoNumber }) {
  const { viewport, camera } = useThree();
  const meshRef = useRef();

  const videoTexture = useVideoTexture(`/video_demo${videoNumber}.mp4`, {
    start: true,
    muted: true,
    loop: true,
  });

  const material = useMemo(() => {
    return createCoverMaterial(
      videoTexture,
      new THREE.Vector2(viewport.width, viewport.height),
      new THREE.Vector2(20, 10),
      0.3
    );
  }, [videoTexture]);

  const updateDimensions = () => {
    if (material._viewportResolution) {
      material._viewportResolution.value.set(viewport.width, viewport.height);
    }
    if (meshRef.current) {
      meshRef.current.scale.set(
        viewport.width / 1.5,
        viewport.height / 1.5,
        1
      );
    }
  };

  useLayoutEffect(() => {
    updateDimensions();
  }, []);

  useEffect(() => {
    updateDimensions();
  }, [viewport]);

  useEffect(() => {
    updateDimensions();
  }, [camera.fov, camera.aspect]);

  return (
    <mesh
      position={[0, 0, -1.5]}
      ref={meshRef}
      scale={[viewport.width, viewport.height, 1]}
      material={material}
    >
      <planeGeometry args={[2.5, 2.5]} />
    </mesh>
  );
}

function ImageBackground({ imageName }) {
  const { viewport, camera } = useThree();
  const meshRef = useRef();

  const imageTexture = useTexture(`/${imageName}.jpg`);

  const material = useMemo(() => {
    return createCoverMaterial(
      imageTexture,
      new THREE.Vector2(viewport.width, viewport.height),
      new THREE.Vector2(20, 10),
      0.2
    );
  }, [imageTexture]);

  const updateDimensions = () => {
    if (material._viewportResolution) {
      material._viewportResolution.value.set(viewport.width, viewport.height);
    }
    if (meshRef.current) {
      meshRef.current.scale.set(
        viewport.width / 1.5,
        viewport.height / 1.5,
        1
      );
    }
  };

  useLayoutEffect(() => {
    updateDimensions();
  }, []);

  useEffect(() => {
    updateDimensions();
  }, [viewport]);

  useEffect(() => {
    updateDimensions();
  }, [camera.fov, camera.aspect]);

  return (
    <mesh
      position={[0, 0, -1.5]}
      ref={meshRef}
      scale={[viewport.width, viewport.height, 1]}
      material={material}
    >
      <planeGeometry args={[2.5, 2.5]} />
    </mesh>
  );
}

export default function BackgroundImageCover() {
  const { background } = useSnapshot(state);

  const isVideo = ["video1", "video2", "video3"].includes(background);
  const videoNumber = isVideo ? background.slice(-1) : null;

  return isVideo ? (
    <VideoBackground videoNumber={videoNumber} />
  ) : (
    <ImageBackground imageName={background} />
  );
}
