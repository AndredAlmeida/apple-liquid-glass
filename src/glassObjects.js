import * as THREE from "three/webgpu";
import { subscribe } from "valtio/vanilla";
import { state } from "./store";

const DRAG_Z = 0.1;

function createRoundedTriangleShape(size, cornerRadius) {
  const halfWidth = size * 0.5;
  const height = size * Math.sqrt(3) * 0.5;
  const points = [
    new THREE.Vector2(0, height * 0.66),
    new THREE.Vector2(-halfWidth, -height * 0.33),
    new THREE.Vector2(halfWidth, -height * 0.33),
  ];
  const shape = new THREE.Shape();

  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const toPrevious = previous.clone().sub(point).normalize();
    const toNext = next.clone().sub(point).normalize();

    return {
      point,
      start: point.clone().add(toPrevious.multiplyScalar(cornerRadius)),
      end: point.clone().add(toNext.multiplyScalar(cornerRadius)),
    };
  });

  shape.moveTo(corners[0].start.x, corners[0].start.y);

  for (let index = 0; index < corners.length; index += 1) {
    const corner = corners[index];
    const nextCorner = corners[(index + 1) % corners.length];

    shape.quadraticCurveTo(
      corner.point.x,
      corner.point.y,
      corner.end.x,
      corner.end.y
    );
    shape.lineTo(nextCorner.start.x, nextCorner.start.y);
  }

  shape.closePath();
  return shape;
}

function createUShape(width, height, legThickness, cornerRadius) {
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const innerLeft = -halfWidth + legThickness;
  const innerRight = halfWidth - legThickness;
  const innerBottom = -halfHeight + legThickness;
  const maxCornerRadius = Math.min(
    cornerRadius,
    legThickness * 0.5,
    halfWidth,
    halfHeight,
    (innerRight - innerLeft) * 0.5
  );
  const shape = new THREE.Shape();

  shape.moveTo(-halfWidth + maxCornerRadius, halfHeight);
  shape.lineTo(innerLeft - maxCornerRadius, halfHeight);
  shape.quadraticCurveTo(innerLeft, halfHeight, innerLeft, halfHeight - maxCornerRadius);
  shape.lineTo(innerLeft, innerBottom + maxCornerRadius);
  shape.quadraticCurveTo(innerLeft, innerBottom, innerLeft + maxCornerRadius, innerBottom);
  shape.lineTo(innerRight - maxCornerRadius, innerBottom);
  shape.quadraticCurveTo(innerRight, innerBottom, innerRight, innerBottom + maxCornerRadius);
  shape.lineTo(innerRight, halfHeight - maxCornerRadius);
  shape.quadraticCurveTo(innerRight, halfHeight, innerRight + maxCornerRadius, halfHeight);
  shape.lineTo(halfWidth - maxCornerRadius, halfHeight);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth, halfHeight - maxCornerRadius);
  shape.lineTo(halfWidth, -halfHeight + maxCornerRadius);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth - maxCornerRadius, -halfHeight);
  shape.lineTo(-halfWidth + maxCornerRadius, -halfHeight);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth, -halfHeight + maxCornerRadius);
  shape.lineTo(-halfWidth, halfHeight - maxCornerRadius);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth + maxCornerRadius, halfHeight);
  shape.closePath();

  return shape;
}

function getMaterialProps(envMap) {
  return {
    color: new THREE.Color(state.glassTintColor),
    metalness: 0,
    roughness: state.textRoughness,
    transmission: 1,
    ior: state.textIor,
    thickness: state.textThickness,
    reflectivity: state.reflectivity,
    envMap,
    envMapIntensity: state.glassReflectionEnabled ? state.glassReflectionOpacity : 0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.05,
    iridescence: 0.9,
    iridescenceIOR: 0.1,
    iridescenceThicknessRange: [0, 140],
    dispersion: 5,
  };
}

function getGeometryDetail() {
  const detail = Math.max(0, Math.round(state.bevelSegments));
  return {
    radialSegments: Math.max(8, detail * 4),
    sphereHeightSegments: Math.max(6, detail * 4),
    capsuleCapSegments: Math.max(2, detail * 2),
  };
}

function getGeometryDimensions() {
  const thicknessAmount = Math.max(0, state.bevelThickness);
  return {
    sphereRadius: Math.max(0.02, 0.1 + state.bevelOffset + thicknessAmount * 0.75),
    capsuleRadius: Math.max(0.02, 0.1 + state.bevelOffset + thicknessAmount * 0.75),
    capsuleLength: Math.max(0.05, 0.3 + state.bevelOffset * 2 + thicknessAmount * 1.5),
  };
}

function createTriangleGeometry() {
  const depthScale = Math.max(0.1, state.extrudeDepth);
  const triangleShape = createRoundedTriangleShape(0.24, 0.045);
  const geometry = new THREE.ExtrudeGeometry(triangleShape, {
    depth: 0.05 * depthScale,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: Math.max(1, Math.round(state.bevelSegments)),
    bevelSize: Math.max(0.002, state.bevelThickness),
    bevelThickness: Math.max(0.001, state.bevelThickness),
    bevelOffset: state.bevelOffset,
    curveSegments: Math.max(8, Math.round(state.bevelSegments) * 3),
  });
  geometry.center();
  return geometry;
}

function createUGeometry() {
  const depthScale = Math.max(0.1, state.extrudeDepth);
  const uShape = createUShape(0.26, 0.26, 0.08, 0.035);
  const geometry = new THREE.ExtrudeGeometry(uShape, {
    depth: 0.05 * depthScale,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: Math.max(1, Math.round(state.bevelSegments)),
    bevelSize: Math.max(0.002, state.bevelThickness),
    bevelThickness: Math.max(0.001, state.bevelThickness),
    bevelOffset: state.bevelOffset,
    curveSegments: Math.max(8, Math.round(state.bevelSegments) * 3),
  });
  geometry.center();
  return geometry;
}

export function createGlassObjects(scene, envMap) {
  const group = new THREE.Group();
  group.position.set(0, 0, DRAG_Z);

  const matProps = getMaterialProps(envMap);
  const detail = getGeometryDetail();
  const dims = getGeometryDimensions();
  const depthScale = Math.max(0.1, state.extrudeDepth);

  // Sphere
  const sphereGeo = new THREE.SphereGeometry(dims.sphereRadius, detail.radialSegments, detail.sphereHeightSegments);
  const sphereMat = new THREE.MeshPhysicalMaterial(matProps);
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.scale.set(2, 2, 0.24 * depthScale);
  sphere.position.set(-0.5, 0, 0);
  sphere.name = "glass-sphere";
  group.add(sphere);

  // Triangle
  const triangleGeo = createTriangleGeometry();
  const triangleMat = new THREE.MeshPhysicalMaterial(matProps);
  const triangle = new THREE.Mesh(triangleGeo, triangleMat);
  triangle.position.set(-0.5, 0.5, 0);
  triangle.name = "glass-triangle";
  group.add(triangle);

  // Capsule
  const capsuleGeo = new THREE.CapsuleGeometry(dims.capsuleRadius, dims.capsuleLength, detail.capsuleCapSegments, detail.radialSegments);
  const capsuleMat = new THREE.MeshPhysicalMaterial(matProps);
  const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
  capsule.scale.set(2, 2, 2 * depthScale);
  capsule.position.set(0.5, 0, 0);
  capsule.rotation.set(0, 0, -Math.PI / 2);
  capsule.name = "glass-capsule";
  group.add(capsule);

  // U-shape
  const uGeo = createUGeometry();
  const uMat = new THREE.MeshPhysicalMaterial(matProps);
  const uMesh = new THREE.Mesh(uGeo, uMat);
  uMesh.position.set(0.5, 0.5, 0);
  uMesh.name = "glass-u";
  group.add(uMesh);

  scene.add(group);

  // Subscribe to material property changes
  const materialKeys = [
    "textIor", "textThickness", "textRoughness", "glassTintColor",
    "reflectivity", "glassReflectionEnabled", "glassReflectionOpacity",
  ];
  let prevMaterialState = materialKeys.map((k) => state[k]);

  subscribe(state, () => {
    const currentMaterialState = materialKeys.map((k) => state[k]);
    const materialChanged = currentMaterialState.some((v, i) => v !== prevMaterialState[i]);

    if (materialChanged) {
      prevMaterialState = currentMaterialState;
      const meshes = [sphere, triangle, capsule, uMesh];
      for (const mesh of meshes) {
        mesh.material.color.set(state.glassTintColor);
        mesh.material.roughness = state.textRoughness;
        mesh.material.ior = state.textIor;
        mesh.material.thickness = state.textThickness;
        mesh.material.reflectivity = state.reflectivity;
        mesh.material.envMapIntensity = state.glassReflectionEnabled ? state.glassReflectionOpacity : 0;
      }
    }
  });

  // Subscribe to geometry-affecting state changes
  const geoKeys = ["bevelSegments", "bevelOffset", "bevelThickness", "extrudeDepth"];
  let prevGeoState = geoKeys.map((k) => state[k]);

  subscribe(state, () => {
    const currentGeoState = geoKeys.map((k) => state[k]);
    const geoChanged = currentGeoState.some((v, i) => v !== prevGeoState[i]);

    if (geoChanged) {
      prevGeoState = currentGeoState;

      const newDepthScale = Math.max(0.1, state.extrudeDepth);
      const newDetail = getGeometryDetail();
      const newDims = getGeometryDimensions();

      // Sphere
      sphere.geometry.dispose();
      sphere.geometry = new THREE.SphereGeometry(newDims.sphereRadius, newDetail.radialSegments, newDetail.sphereHeightSegments);
      sphere.scale.set(2, 2, 0.24 * newDepthScale);

      // Triangle
      triangle.geometry.dispose();
      triangle.geometry = createTriangleGeometry();

      // Capsule
      capsule.geometry.dispose();
      capsule.geometry = new THREE.CapsuleGeometry(newDims.capsuleRadius, newDims.capsuleLength, newDetail.capsuleCapSegments, newDetail.radialSegments);
      capsule.scale.set(2, 2, 2 * newDepthScale);

      // U-shape
      uMesh.geometry.dispose();
      uMesh.geometry = createUGeometry();
    }
  });

  return group;
}

export function setupDragInteraction(group, camera, domElement) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -DRAG_Z);
  const dragOffset = new THREE.Vector3();
  const dragPoint = new THREE.Vector3();
  let isDragging = false;

  const meshes = group.children;

  function getNDC(event) {
    const rect = domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onPointerDown(event) {
    getNDC(event);
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(meshes, false);
    if (intersects.length === 0) return;

    isDragging = true;
    state.isDragging = true;
    domElement.setPointerCapture(event.pointerId);

    if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
      dragOffset.copy(group.position).sub(dragPoint);
    }
  }

  function onPointerMove(event) {
    if (!isDragging) return;

    getNDC(event);
    raycaster.setFromCamera(pointer, camera);

    if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
      group.position.set(
        dragPoint.x + dragOffset.x,
        dragPoint.y + dragOffset.y,
        DRAG_Z
      );
    }
  }

  function onPointerUp(event) {
    if (!isDragging) return;
    isDragging = false;
    state.isDragging = false;
    domElement.releasePointerCapture(event.pointerId);
  }

  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("pointercancel", onPointerUp);
}
