import { Capsule, Sphere } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three/webgpu";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { useSnapshot } from "valtio";
import { state } from "../store";

const DRAG_Z = 0.1;

function syncCursorCenter(position) {
  state.cursorCenterX = position.x;
  state.cursorCenterY = position.y;
  state.cursorCenterZ = position.z;
}

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
  shape.quadraticCurveTo(
    innerLeft,
    halfHeight,
    innerLeft,
    halfHeight - maxCornerRadius
  );
  shape.lineTo(innerLeft, innerBottom + maxCornerRadius);
  shape.quadraticCurveTo(
    innerLeft,
    innerBottom,
    innerLeft + maxCornerRadius,
    innerBottom
  );
  shape.lineTo(innerRight - maxCornerRadius, innerBottom);
  shape.quadraticCurveTo(
    innerRight,
    innerBottom,
    innerRight,
    innerBottom + maxCornerRadius
  );
  shape.lineTo(innerRight, halfHeight - maxCornerRadius);
  shape.quadraticCurveTo(
    innerRight,
    halfHeight,
    innerRight + maxCornerRadius,
    halfHeight
  );
  shape.lineTo(halfWidth - maxCornerRadius, halfHeight);
  shape.quadraticCurveTo(
    halfWidth,
    halfHeight,
    halfWidth,
    halfHeight - maxCornerRadius
  );
  shape.lineTo(halfWidth, -halfHeight + maxCornerRadius);
  shape.quadraticCurveTo(
    halfWidth,
    -halfHeight,
    halfWidth - maxCornerRadius,
    -halfHeight
  );
  shape.lineTo(-halfWidth + maxCornerRadius, -halfHeight);
  shape.quadraticCurveTo(
    -halfWidth,
    -halfHeight,
    -halfWidth,
    -halfHeight + maxCornerRadius
  );
  shape.lineTo(-halfWidth, halfHeight - maxCornerRadius);
  shape.quadraticCurveTo(
    -halfWidth,
    halfHeight,
    -halfWidth + maxCornerRadius,
    halfHeight
  );
  shape.closePath();

  return shape;
}

export default function CustomCursor() {
  const groupRef = useRef();
  const dragOffsetRef = useRef(new THREE.Vector3());
  const dragPointRef = useRef(new THREE.Vector3());
  const warehouseEnvMap = useLoader(RGBELoader, "/empty_warehouse_01_1k.hdr");
  warehouseEnvMap.mapping = THREE.EquirectangularReflectionMapping;
  const [isDraggingObjects, setIsDraggingObjects] = useState(false);
  const {
    reflectivity,
    textIor,
    textThickness,
    textRoughness,
    bevelSegments,
    bevelOffset,
    bevelThickness,
    extrudeDepth,
    glassTintColor,
    glassReflectionEnabled,
    glassReflectionOpacity,
  } = useSnapshot(state);
  const dragPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), -DRAG_Z),
    []
  );

  useEffect(() => {
    syncCursorCenter(new THREE.Vector3(0, 0, DRAG_Z));

    const endDrag = () => {
      setIsDraggingObjects(false);
      state.isDragging = false;
    };

    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  const updateDraggedPosition = (event) => {
    if (!groupRef.current) {
      return;
    }

    if (!event.ray.intersectPlane(dragPlane, dragPointRef.current)) {
      return;
    }

    groupRef.current.position.set(
      dragPointRef.current.x + dragOffsetRef.current.x,
      dragPointRef.current.y + dragOffsetRef.current.y,
      DRAG_Z
    );
  };

  const handlePointerDown = (event) => {
    event.stopPropagation();
    if (!groupRef.current) {
      return;
    }

    setIsDraggingObjects(true);
    state.isDragging = true;
    event.target.setPointerCapture?.(event.pointerId);

    if (!event.ray.intersectPlane(dragPlane, dragPointRef.current)) {
      return;
    }

    dragOffsetRef.current.copy(groupRef.current.position).sub(dragPointRef.current);
  };

  const handlePointerMove = (event) => {
    if (!isDraggingObjects) {
      return;
    }

    event.stopPropagation();
    updateDraggedPosition(event);
  };

  const handlePointerUp = (event) => {
    if (!isDraggingObjects) {
      return;
    }

    event.stopPropagation();
    setIsDraggingObjects(false);
    state.isDragging = false;
    event.target.releasePointerCapture?.(event.pointerId);
  };

  const geometryDetail = useMemo(() => {
    const detail = Math.max(0, Math.round(bevelSegments));
    const radialSegments = Math.max(8, detail * 4);
    const sphereHeightSegments = Math.max(6, detail * 4);
    const capsuleCapSegments = Math.max(2, detail * 2);

    return { radialSegments, sphereHeightSegments, capsuleCapSegments };
  }, [bevelSegments]);

  const geometryDimensions = useMemo(() => {
    const thicknessAmount = Math.max(0, bevelThickness);
    const sphereRadius = Math.max(0.02, 0.1 + bevelOffset + thicknessAmount * 0.75);
    const capsuleRadius = Math.max(
      0.02,
      0.1 + bevelOffset + thicknessAmount * 0.75
    );
    const capsuleLength = Math.max(
      0.05,
      0.3 + bevelOffset * 2 + thicknessAmount * 1.5
    );

    return { sphereRadius, capsuleRadius, capsuleLength };
  }, [bevelOffset, bevelThickness]);

  const depthScale = useMemo(() => Math.max(0.1, extrudeDepth), [extrudeDepth]);

  const roundedTriangleGeometry = useMemo(() => {
    const triangleShape = createRoundedTriangleShape(0.24, 0.045);
    const geometry = new THREE.ExtrudeGeometry(triangleShape, {
      depth: 0.05 * depthScale,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: Math.max(1, Math.round(bevelSegments)),
      bevelSize: Math.max(0.002, bevelThickness),
      bevelThickness: Math.max(0.001, bevelThickness),
      bevelOffset,
      curveSegments: Math.max(8, Math.round(bevelSegments) * 3),
    });
    geometry.center();

    return geometry;
  }, [bevelOffset, bevelSegments, bevelThickness, depthScale]);

  const roundedUGeometry = useMemo(() => {
    const uShape = createUShape(0.26, 0.26, 0.08, 0.035);
    const geometry = new THREE.ExtrudeGeometry(uShape, {
      depth: 0.05 * depthScale,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: Math.max(1, Math.round(bevelSegments)),
      bevelSize: Math.max(0.002, bevelThickness),
      bevelThickness: Math.max(0.001, bevelThickness),
      bevelOffset,
      curveSegments: Math.max(8, Math.round(bevelSegments) * 3),
    });
    geometry.center();

    return geometry;
  }, [bevelOffset, bevelSegments, bevelThickness, depthScale]);

  useEffect(() => {
    return () => {
      roundedTriangleGeometry.dispose();
      roundedUGeometry.dispose();
    };
  }, [roundedTriangleGeometry, roundedUGeometry]);

  const materialProps = useMemo(() => {
    return {
      color: glassTintColor,
      metalness: 0,
      roughness: textRoughness,
      transmission: 1,
      ior: textIor,
      thickness: textThickness,
      reflectivity,
      envMap: warehouseEnvMap,
      envMapIntensity: glassReflectionEnabled ? glassReflectionOpacity : 0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.05,
      iridescence: 0.9,
      iridescenceIOR: 0.1,
      iridescenceThicknessRange: [0, 140],
      dispersion: 5,
    };
  }, [
    reflectivity,
    textIor,
    textThickness,
    textRoughness,
    glassTintColor,
    glassReflectionEnabled,
    glassReflectionOpacity,
    warehouseEnvMap,
  ]);

  return (
    <group ref={groupRef} position={[0, 0, DRAG_Z]}>
      <Sphere
        scale={[2, 2, 0.24 * depthScale]}
        args={[
          geometryDimensions.sphereRadius,
          geometryDetail.radialSegments,
          geometryDetail.sphereHeightSegments,
        ]}
        position={[-0.5, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <meshPhysicalMaterial {...materialProps} />
      </Sphere>

      <mesh
        position={[-0.5, 0.5, 0]}
        geometry={roundedTriangleGeometry}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <meshPhysicalMaterial {...materialProps} />
      </mesh>

      <Capsule
        scale={[2, 2, 2 * depthScale]}
        args={[
          geometryDimensions.capsuleRadius,
          geometryDimensions.capsuleLength,
          geometryDetail.capsuleCapSegments,
          geometryDetail.radialSegments,
        ]}
        position={[0.5, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <meshPhysicalMaterial {...materialProps} />
      </Capsule>

      <mesh
        position={[0.5, 0.5, 0]}
        geometry={roundedUGeometry}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <meshPhysicalMaterial {...materialProps} />
      </mesh>
    </group>
  );
}
