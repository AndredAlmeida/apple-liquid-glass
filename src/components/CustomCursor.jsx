import { Capsule, MeshTransmissionMaterial, Sphere } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useSnapshot } from "valtio";
import { state } from "../store";

const DRAG_Z = 0.1;

function syncCursorCenter(position) {
  state.cursorCenterX = position.x;
  state.cursorCenterY = position.y;
  state.cursorCenterZ = position.z;
}

export default function CustomCursor() {
  const groupRef = useRef();
  const dragOffsetRef = useRef(new THREE.Vector3());
  const dragPointRef = useRef(new THREE.Vector3());
  const [isDraggingObjects, setIsDraggingObjects] = useState(false);
  const { reflectivity, textIor, textThickness, textRoughness, sampleSize } =
    useSnapshot(state);
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

  const sampleCount = useMemo(() => {
    if (sampleSize === "low") {
      return 2;
    }
    if (sampleSize === "high") {
      return 8;
    }
    return 4;
  }, [sampleSize]);

  const materialProps = useMemo(() => {
    return {
      color: "white",
      metalness: 0,
      roughness: textRoughness,
      ior: textIor,
      thickness: textThickness,
      reflectivity,
      chromaticAberration: 0.1,
      clearcoat: 0.4,
      resolution: 1024,
      clearcoatRoughness: 0.05,
      iridescence: 0.9,
      iridescenceIOR: 0.1,
      iridescenceThicknessRange: [0, 140],
      samples: sampleCount,
    };
  }, [reflectivity, textIor, textThickness, textRoughness, sampleCount]);

  return (
    <group ref={groupRef} position={[0, 0, DRAG_Z]}>
      <Sphere
        scale={[2, 2, 0.24]}
        args={[0.1, 64, 64]}
        position={[-0.5, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <MeshTransmissionMaterial {...materialProps} />
      </Sphere>

      <Capsule
        scale={[2, 2, 2]}
        args={[0.1, 0.3, 64, 64]}
        position={[0.5, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <MeshTransmissionMaterial {...materialProps} />
      </Capsule>
    </group>
  );
}
