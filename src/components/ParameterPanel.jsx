import { useSnapshot } from "valtio";
import { state } from "../store";

const sampleSizes = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const cameraModes = [
  { value: "perspective", label: "Perspective" },
  { value: "orthographic", label: "Orthographic" },
];

const controls = [
  {
    key: "bevelSegments",
    label: "Bevel Segments",
    min: 0,
    max: 20,
    step: 1,
    integer: true,
  },
  {
    key: "bevelOffset",
    label: "Bevel Offset",
    min: -0.05,
    max: 0.05,
    step: 0.001,
  },
  {
    key: "bevelThickness",
    label: "Bevel Thickness",
    min: 0,
    max: 0.1,
    step: 0.001,
  },
  {
    key: "textIor",
    label: "IOR",
    min: 1,
    max: 2.5,
    step: 0.01,
  },
  {
    key: "textThickness",
    label: "Thickness",
    min: 0,
    max: 5,
    step: 0.01,
  },
  {
    key: "textRoughness",
    label: "Roughness",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "extrudeDepth",
    label: "Extrude Depth",
    min: 0.1,
    max: 3,
    step: 0.01,
  },
  {
    key: "cameraYAngle",
    label: "Camera Y Angle",
    min: -90,
    max: 90,
    step: 1,
    integer: true,
  },
];

function formatValue(value, integer) {
  if (integer) {
    return value;
  }

  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

export default function ParameterPanel() {
  const values = useSnapshot(state);

  return (
    <div className="parameter-panel">
      <p className="parameter-panel__title">Parameters</p>

      {controls.map((control) => (
        <label className="parameter-panel__row" key={control.key}>
          <span className="parameter-panel__label">{control.label}</span>
          <span className="parameter-panel__value">
            {formatValue(values[control.key], control.integer)}
          </span>
          <input
            className="parameter-panel__slider"
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={values[control.key]}
            onChange={(event) => {
              const nextValue = control.integer
                ? Number.parseInt(event.target.value, 10)
                : Number(event.target.value);
              state[control.key] = nextValue;
            }}
          />
        </label>
      ))}

      <label className="parameter-panel__row">
        <span className="parameter-panel__label">Glass Tint</span>
        <span className="parameter-panel__value">{values.glassTintColor}</span>
        <input
          className="parameter-panel__color"
          type="color"
          value={values.glassTintColor}
          onChange={(event) => {
            state.glassTintColor = event.target.value;
          }}
        />
      </label>

      <label className="parameter-panel__row">
        <span className="parameter-panel__label">SampleSize</span>
        <span className="parameter-panel__value">
          {sampleSizes.find((option) => option.value === values.sampleSize)?.label}
        </span>
        <select
          className="parameter-panel__select"
          value={values.sampleSize}
          onChange={(event) => {
            state.sampleSize = event.target.value;
          }}
        >
          {sampleSizes.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="parameter-panel__row">
        <span className="parameter-panel__label">Camera</span>
        <span className="parameter-panel__value">
          {cameraModes.find((option) => option.value === values.cameraMode)?.label}
        </span>
        <select
          className="parameter-panel__select"
          value={values.cameraMode}
          onChange={(event) => {
            state.cameraMode = event.target.value;
          }}
        >
          {cameraModes.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
