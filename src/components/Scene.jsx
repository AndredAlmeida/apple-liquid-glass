import React, { Suspense } from "react";
import { Environment, useEnvironment } from "@react-three/drei";

function Scene() {
  const warehouseEnvMap = useEnvironment({ preset: "warehouse" });

  return (
    <>
      <Suspense fallback={null}>
        <Environment map={warehouseEnvMap} environmentIntensity={0.25} />
      </Suspense>
    </>
  );
}

export default Scene;
