"use client";

import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { DrawData } from "@/scripts/drawSerializer";
import Button from "./ui/Button";
import type { Position, Color } from "@/scripts/drawing";

type Props = {
  url?: string;
  id?: string;
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
  context: CanvasRenderingContext2D
) {
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

export default function Canvas({ url, id }: Props) {
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [prevPos, setPrevPos] = useState<Position | null>(null);
  const [drawData, setDrawData] = useState<Array<DrawData>>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ws, setWS] = useState<WebSocket | null>(null);
  const [incomingDrawingData, setIncomingDrawingData] = useState<
    Array<DrawData>
  >([]);

  function sender(data: string) {
    console.log(data);
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
    console.log(ws);
    if (!url || ws) return;
    const wsClosure = getWSclosure(url);
    const wsocket = wsClosure();
    wsocket.addEventListener("message", (msg) => {
      let incoming;
      try {
        incoming = JSON.parse(msg.data);
      } catch (e) {
        return;
      }
      setIncomingDrawingData([...incomingDrawingData, incoming]);
    });
    setWS(wsocket);
  }, [url]);

  useEffect(() => {
    if (!context) return;
    for (let i = 0; i < incomingDrawingData.length; i++) {
      if (incomingDrawingData[i].actionType === "draw line") {
        const drawData = incomingDrawingData[i];
        //console.log(drawData)
        const actionsLen = drawData.actions.length;
        for (let j = 0; i < actionsLen; j++) {
          console.log(drawData.actions[j]);
          const action = drawData.actions[j];
          if (!action) return;
          drawLine(action.end, action.start, context);
        }
      }
    }
  }, [incomingDrawingData]);

  useEffect(() => {
    if (!ws || ws.readyState != 1) return;
    console.log(ws, id);
    if (!id) {
      console.log("init");
      ws.send("init");
    } else {
      ws.send(id);
    }
  }, [ws, ws?.readyState]);

  return (
    <div className="w-fit">
      <canvas
        ref={canvas}
        width={400}
        height={400}
        className="bg-neutral-100"
        onMouseMove={(e) => {
          if (context && isPressed && e.target instanceof HTMLCanvasElement) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.x;
            const y = e.clientY - rect.y;
            context.beginPath();
            if (!prevPos) {
              setDrawData([...drawData, new DrawData("draw line", [])]);
            } else {
              drawLine({ x: x, y: y }, prevPos, context);
              drawData.at(-1)?.addAction("line", prevPos, { x: x, y: y });
            }
            setPrevPos({ x: x, y: y });
          }
        }}
        onMouseLeave={() => {
          setIsPressed(false);
          setPrevPos(null);
        }}
        onMouseDown={() => {
          setIsPressed(true);
        }}
        onMouseUp={() => {
          setIsPressed(false);
          setPrevPos(null);
          drawData.pop()?.send(sender);
        }}
      ></canvas>
      <div className="w-full flex justify-between">
        <Button
          onClick={() => {
            if (!canvas.current) return;
            clearCanvas(canvas.current);
          }}
          className="w-full mr-1"
        >
          Clear
        </Button>
        <Button
          onClick={() => {
            if (!canvas.current || !context || !url) return;
            //const imageData = context.getImageData(0, 0, canvas.current.width, canvas.current.height)
            axios.post(url, canvas.current.toDataURL());
          }}
          className="w-2/6"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
