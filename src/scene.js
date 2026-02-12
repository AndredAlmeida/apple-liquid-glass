import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { easing } from "maath";
import { state } from "./store";

const BASE_CAMERA_DISTANCE = 25;

export function setupCameras() {
  const perspective = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 0.01, 1000);
  perspective.position.set(0, 0, 25);

  const orthographic = new THREE.OrthographicCamera(
    -window.innerWidth / 2, window.innerWidth / 2,
    window.innerHeight / 2, -window.innerHeight / 2,
    0.01, 1000
  );
  orthographic.zoom = 400;
  orthographic.position.set(0, 0, 25);
  orthographic.updateProjectionMatrix();

  return { perspective, orthographic };
}

export function updateCameraAspect(cameras, width, height) {
  cameras.perspective.aspect = width / height;
  cameras.perspective.updateProjectionMatrix();

  cameras.orthographic.left = -width / 2;
  cameras.orthographic.right = width / 2;
  cameras.orthographic.top = height / 2;
  cameras.orthographic.bottom = -height / 2;
  cameras.orthographic.updateProjectionMatrix();
}

export function setupEnvironment(scene, envMap) {
  scene.environment = envMap;
  scene.environmentIntensity = 0.25;
}

export function setupControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.target.set(0, 0, 0.1);
  controls.dampingFactor = 0.25;
  controls.maxDistance = 25;
  controls.minDistance = 20;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = 1.7;
  controls.enableDamping = true;
  controls.update();
  return controls;
}

export function setupLights(scene) {
  const light = new THREE.DirectionalLight(0xffffff, 8);
  light.position.set(0.4, 1, -0.2);
  scene.add(light);
  return light;
}

const LOOKAT_X = 0;
const LOOKAT_Y = 0;
const LOOKAT_Z = 0.1;

export function animateCamera(camera, controls, delta) {
  const angleInRadians = THREE.MathUtils.degToRad(
    THREE.MathUtils.clamp(state.cameraYAngle, -90, 90)
  );
  const cameraRadius = Math.max(0.1, BASE_CAMERA_DISTANCE - LOOKAT_Z);
  const desiredPosition = [
    LOOKAT_X + Math.sin(angleInRadians) * cameraRadius,
    LOOKAT_Y,
    LOOKAT_Z + Math.cos(angleInRadians) * cameraRadius,
  ];

  easing.damp3(camera.position, desiredPosition, 0.25, delta);
  controls.update();
}

export function animateLight(light, pointer, delta) {
  easing.damp3(
    light.position,
    [pointer.x, pointer.y, -0.01],
    0.6,
    delta
  );
}
