import { useSnapshot } from "valtio";
import { state } from "../store";

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
      <p className="parameter-panel__title">Text Parameters</p>

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
    </div>
  );
}
