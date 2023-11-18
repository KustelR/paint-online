"use client";

import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { DrawData } from "@/scripts/drawSerializer";
import Button from "./ui/Button";
import type { Position, Color } from "@/scripts/drawing";
import { ColorFromHex, RGBAColor } from "@/scripts/drawing";

type Props = {
  height: number;
  width: number;
  url?: string;
  id?: string;
  getId?: (id: string) => void;
};

function getWSclosure(url: string) {
  let ws: WebSocket;
  let created = false;

  return function () {
    if (!ws && !created) {
      ws = new WebSocket(url);
      created = true;
      return ws;
    }
    return ws;
  };
}

function drawLine(
  pos: Position,
  prevPos: Position,
  context: CanvasRenderingContext2D,
  color: Color
) {
  //console.log(color)
  //console.log(color.toHexString())
  context.strokeStyle = color.toHexString();
  context.beginPath();
  context.moveTo(prevPos.x, prevPos.y);
  context.lineTo(pos.x, pos.y);
  context.stroke();
}

function clearCanvas(canvas: HTMLCanvasElement): void {
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    return;
  }
  const ctx = canvas.getContext("2d");
  let canvasData = new ImageData(canvas.width, canvas.height);
  ctx?.putImageData(canvasData, 0, 0);
}

export default function Canvas({ url, id, height, width, getId }: Props) {
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [prevPos, setPrevPos] = useState<Position | null>(null);
  const [drawBuffer, setDrawBuffer] = useState<DrawData>(
    new DrawData([], new RGBAColor(0, 0, 0, 0))
  );
  const [ws, setWS] = useState<WebSocket | null>(null);
  const [incomingDrawingData, setIncomingDrawingData] = useState<
    Array<DrawData>
  >([]);
  const [color, setColor] = useState<string>("000000");
  const canvas = useRef<HTMLCanvasElement>(null);

  function sender(data: string) {
    if (!ws || ws.readyState != 1) return;
    ws.send(data);
  }
  useEffect(() => {
    if (!canvas.current || !(canvas.current instanceof HTMLCanvasElement))
      return;
    const ctx = canvas.current.getContext("2d", { willReadFrequently: true });
    if (!(ctx instanceof CanvasRenderingContext2D)) return;
    setContext(ctx);
  }, [context]);

  useEffect(() => {
    console.log(id)
    if (!url || ws) return;
    const wsClosure = getWSclosure(url);
    const wsocket = wsClosure();
    wsocket.addEventListener("open", () => {
      if (!id) {
        wsocket.send("init");
      } else {
        wsocket.send(id);
      }
    });
    wsocket.addEventListener("message", (msg) => {
      let incoming;
      try {
        incoming = JSON.parse(msg.data);
      } catch (e) {
        if (getId) getId(msg.data);
        return;
      }
      setIncomingDrawingData([...incomingDrawingData, incoming]);
    });
    setWS(wsocket);
  }, [url]);

  useEffect(() => {
    if (!context) return;
    for (let i = 0; i < incomingDrawingData.length; i++) {
      const drawData = incomingDrawingData[i];
      const actionsLen = drawData.actions.length;
      for (let j = 0; j < actionsLen; j++) {
        const action = drawData.actions[j];
        switch (action.type) {
        case "line": {
            if (!action || !action.start || !action.end) return;
            const colorData = drawData.color;
            drawLine(
              action.end,
              action.start,
              context,
              colorData
                ? Object.assign(new RGBAColor(0, 0, 0, 0), colorData)
                : new RGBAColor(0, 0, 0, 255)
            );
          }
          break;
        case "clear canvas": {
          if (canvas.current) {
            clearCanvas(canvas.current);
            break;
          }
        }
      }
    }
    }
    //setIncomingDrawingData([])
  }, [incomingDrawingData]);

  return (
    <div className=" border border-neutral-200 border-t-4 border-t-cyan-500">
      <div className="md:flex">
        <div className="border border-neutral-300 m-1 overflow-scroll">
        <canvas
        className=""
          ref={canvas}
          width={width}
          height={height}
          onMouseMove={(e) => {
            if (context && isPressed && e.target instanceof HTMLCanvasElement) {
              const rect = e.target.getBoundingClientRect();
              const x = e.clientX - rect.x;
              const y = e.clientY - rect.y;
              context.beginPath();
              if (!prevPos) {
                setDrawBuffer(
                  new DrawData([], ColorFromHex(color))
                );
                context;
              } else {
                drawLine({ x: x, y: y }, prevPos, context, ColorFromHex(color)); //
                drawBuffer.addAction("line", prevPos, { x: x, y: y });
              }
              setPrevPos({ x: x, y: y });
            }
          }}
          onMouseLeave={() => {
            setIsPressed(false);
            setPrevPos(null);
            drawBuffer.send(sender);
            setDrawBuffer(new DrawData([]));
          }}
          onMouseDown={() => {
            setIsPressed(true);
          }}
          onMouseUp={() => {
            setIsPressed(false);
            setPrevPos(null);
            drawBuffer.send(sender);
          }}
        ></canvas>
        </div>
        <div className="px-2 m-1 border-l border-l-neutral-200">
          <ul>
            <li>
              <label className="block" htmlFor="color">
                Color
              </label>
              <input
                className="bg-neutral-100"
                placeholder="#000000"
                onChange={(e) => {
                  if (
                    e.target.value.length < 7 ||
                    !e.target.value.startsWith("#")
                  )
                    return;
                  setColor(e.target.value);
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
                  if (Number.isNaN(w) || !context) return;
                  context.lineWidth = w;
                }}
                type="text"
                className="bg-neutral-100"
              />
            </li>
          </ul>
        </div>

      </div>
          <div className="flex m-2">
          <Button
            onClick={() => {
              if (!canvas.current) return;
              clearCanvas(canvas.current);
              const newCommand = new DrawData([{type: "clear canvas"}]);
              newCommand.send(sender);
              setDrawBuffer(new DrawData([]));
            }}
            className="px-20 mr-1"
          >
            Clear
          </Button>
        </div>
 
   </div>
  );
}
