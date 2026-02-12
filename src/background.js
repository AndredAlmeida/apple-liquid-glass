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
import { subscribe } from "valtio/vanilla";
import { state } from "./store";

function createCoverMaterial(mapTexture, viewportRes, videoRes, darkenAmount) {
  const viewportResolution = uniform(viewportRes, "vec2");
  const videoResolution = uniform(videoRes, "vec2");

  const vScreenPos = varying(positionLocal.xy, "vScreenPos");

  const coverFragment = Fn(() => {
    const viewportAspect = viewportResolution.x.div(viewportResolution.y);
    const videoAspect = videoResolution.x.div(videoResolution.y);

    const screenUV = vScreenPos.add(1.0).mul(0.5).toVar("screenUV");

    const videoIsWider = videoAspect.greaterThan(viewportAspect);

    const scale = select(
      videoIsWider,
      viewportAspect.div(videoAspect),
      videoAspect.div(viewportAspect)
    );

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

    const texColor = texture(mapTexture, finalUV);

    const finalColor = mix(texColor.rgb, vec3(0.0, 0.0, 0.0), darkenAmount);

    return vec4(finalColor, 1.0);
  });

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = coverFragment();
  material.depthWrite = false;

  material._viewportResolution = viewportResolution;
  material._videoResolution = videoResolution;

  return material;
}

let bgMesh = null;
let currentMaterial = null;
let currentVideoEl = null;

export function createBackground(scene, viewportSize) {
  const geometry = new THREE.PlaneGeometry(2.5, 2.5);
  bgMesh = new THREE.Mesh(geometry);
  bgMesh.position.set(0, 0, -1.5);
  bgMesh.scale.set(viewportSize.width / 1.5, viewportSize.height / 1.5, 1);
  scene.add(bgMesh);
  return bgMesh;
}

export function setBackgroundTexture(tex, viewportSize, darkenAmount) {
  if (currentMaterial) {
    currentMaterial.dispose();
  }
  currentMaterial = createCoverMaterial(
    tex,
    new THREE.Vector2(viewportSize.width, viewportSize.height),
    new THREE.Vector2(20, 10),
    darkenAmount
  );
  bgMesh.material = currentMaterial;
}

export function updateBackgroundSize(viewportSize) {
  if (!bgMesh) return;
  bgMesh.scale.set(viewportSize.width / 1.5, viewportSize.height / 1.5, 1);
  if (currentMaterial && currentMaterial._viewportResolution) {
    currentMaterial._viewportResolution.value.set(viewportSize.width, viewportSize.height);
  }
}

function createVideoElement(src) {
  const video = document.createElement("video");
  video.src = src;
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.play();
  return video;
}

function stopCurrentVideo() {
  if (currentVideoEl) {
    currentVideoEl.pause();
    currentVideoEl.removeAttribute("src");
    currentVideoEl.load();
    currentVideoEl = null;
  }
}

export function setupBackgroundSwitching(scene, viewportSize, textureLoader) {
  function applyBackground(bg) {
    stopCurrentVideo();

    const isVideo = ["video1", "video2", "video3"].includes(bg);

    if (isVideo) {
      const videoNumber = bg.slice(-1);
      const video = createVideoElement(`/video_demo${videoNumber}.mp4`);
      currentVideoEl = video;
      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      setBackgroundTexture(videoTexture, viewportSize, 0.3);
    } else {
      textureLoader.load(`/${bg}.jpg`, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setBackgroundTexture(tex, viewportSize, 0.2);
      });
    }
  }

  // Apply initial background
  let prevBackground = state.background;
  applyBackground(prevBackground);

  // React to changes
  subscribe(state, () => {
    if (state.background !== prevBackground) {
      prevBackground = state.background;
      applyBackground(state.background);
    }
  });
}
