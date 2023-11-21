import React from "react";

type Props = {
  colorSetter: (color: string) => void;
  lineWidthSetter: (width: number) => void;
  drawModeSetter: (mode: number) => void;
  fillToggler: () => void; 
  undo: () => void;
  redo: () => void;
};

const PencilDrawMode = 0;
const LineDrawMode = 1;
const CircleDrawMode = 2;

export default function CanvasControl({
  colorSetter,
  lineWidthSetter,
  drawModeSetter,
  fillToggler,
  undo,
  redo,
}: Props) {
  return (
    <div className="px-2 m-1 border-l border-l-neutral-200">
      <ul>
        <li className="mb-4 border-b border-neutral-200">
          <h3 className="font-bold">Draw mode</h3>
          <ul>
            <li>
              <button onClick={() => drawModeSetter(PencilDrawMode)}>
                Pencil
              </button>
            </li>
            <li>
              <button onClick={() => drawModeSetter(LineDrawMode)}>
                Line
              </button>
            </li>
            <li>
              <button onClick={() => drawModeSetter(CircleDrawMode)}>Circle</button>
            </li>
          </ul>
        </li>
        <li>
          <label className="block" htmlFor="color">
            Color
          </label>
          <input
            className="bg-neutral-100"
            placeholder="#000000"
            onChange={(e) => {
              if (e.target.value.length < 7 || !e.target.value.startsWith("#"))
                return;
              colorSetter(e.target.value);
            }}
            name="color"
            type="color"
          />
        </li>
        <li>
          <label htmlFor="line-width" className="block">
            Line width
          </label>
          <input
            name="line-width"
            onChange={(e) => {
              const w = Number(e.target.value);
              lineWidthSetter(w);
            }}
            type="text"
            className="bg-neutral-100"
          />
        </li>
        <li className="flex justify-between">
          <button onClick={undo}>{"Undo <-"}</button>
          <button onClick={redo}>{"Redo ->"}</button>
        </li>
      </ul>
      <div>
        <h3 className="font-bold">Settings</h3>
        <label><input onChange={fillToggler} type="checkbox" />Fill</label>
      </div>
    </div>
  );
}
