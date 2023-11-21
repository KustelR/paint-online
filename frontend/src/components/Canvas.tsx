"use client";

import React, { useRef, useState, useEffect } from "react";
import { DrawData, History } from "@/scripts/drawSerializer";
import Button from "./ui/Button";
import type { Position, Color } from "@/scripts/drawing";
import { ColorFromHex, RGBAColor } from "@/scripts/drawing";
import CanvasControl from "./CanvasControl";

type IncomingMsg = {
  MsgType: string;
  Content: IncomingHistory | DrawData;
};

type IncomingHistory = {
  Actions: Array<DrawData>;
  RedoArr: Array<DrawData>;
};

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

function getCanvasCoordinates(e: any): Position | null {
  if (!(e.target instanceof HTMLCanvasElement)) {
    return null;
  }
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.x;
  const y = e.clientY - rect.y;
  return { x: x, y: y };
}

function drawLine(
  pos: Position,
  prevPos: Position,
  context: CanvasRenderingContext2D,
  width?: number,
  color?: Color
) {
  if (color) {
    context.strokeStyle = color.toHexString();
  }
  if (width) {
    context.lineWidth = width;
  }
  context.beginPath();
  context.moveTo(prevPos.x, prevPos.y);
  context.lineTo(pos.x, pos.y);
  context.stroke();
}

function handleDrawData(
  data: DrawData,
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  let oldLineWidth = 1;
  if (data.lineWidth) {
    oldLineWidth = context.lineWidth;
    context.lineWidth = data.lineWidth;
  }
  const actionsLen = data.actions.length;
  for (let j = 0; j < actionsLen; j++) {
    const action = data.actions[j];
    switch (action.type) {
      case "line":
        {
          if (!action || !action.start || !action.end) return;
          const colorData = data.color;
          drawLine(
            action.end,
            action.start,
            context,
            undefined,
            colorData
              ? Object.assign(new RGBAColor(0, 0, 0, 0), colorData)
              : new RGBAColor(0, 0, 0, 255)
          );
        }
        break;
      case "clear canvas": {
        if (canvas) {
          clearCanvas(canvas);
        }
        break;
      }
    }
  }
  if (oldLineWidth) {
    context.lineWidth = oldLineWidth;
  }
}

function clearCanvas(canvas: HTMLCanvasElement): void {
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    return;
  }
  const ctx = canvas.getContext("2d");
  let canvasData = new ImageData(canvas.width, canvas.height);
  ctx?.putImageData(canvasData, 0, 0);
}

function redo(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  history: History
) {
  clearCanvas(canvas);
  history.redo();
  history.remind().forEach((data) => {
    handleDrawData(data, context, canvas);
  });
}

function undo(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  history: History
) {
  clearCanvas(canvas);
  history.undo();
  history.remind().forEach((data) => {
    handleDrawData(data, context, canvas);
  });
}

export default function Canvas({ url, id, height, width, getId }: Props) {
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [prevPos, setPrevPos] = useState<Position | null>(null);
  const [drawBuffer, setDrawBuffer] = useState<DrawData>(new DrawData([]));
  const [history, setHistory] = useState<History>(new History());
  const [ws, setWS] = useState<WebSocket | null>(null);
  const [incomingDrawingData, setIncomingDrawingData] = useState<
    Array<DrawData>
  >([]);
  const [color, setColor] = useState<string>("000000");
  const [lineWidth, setLineWidth] = useState<number>(1);
  const [drawingStart, setDrawingStart] = useState<Position | undefined>();
  const [incomingHistoryChange, setIncomingHistoryChange] = useState<
    IncomingMsg | undefined
  >();
  const [drawMode, setDrawMode] = useState<number>(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  function sender(data: DrawData) {
    if (!ws || ws.readyState != 1) return;
    history.addAction(data);
    ws.send(JSON.stringify({ MsgType: "drawing", Content: data }));
  }

  function drawModeSetter(mode: number) {
    setDrawMode(mode);
  }

  function colorSetter(color: string) {
    setColor(color);
  }

  function lineWidthSetter(width: number) {
    if (Number.isNaN(width) || !context) return;
    setLineWidth(width);
  }

  function undoOnClick() {
    if (!canvas.current || !context) return;
    undo(canvas.current, context, history);
    const msg = { MsgType: "history_undo", Content: null };
    ws?.send(JSON.stringify(msg));
  }

  function redoOnClick() {
    if (!canvas.current || !context) return;
    redo(canvas.current, context, history);
    const msg = { MsgType: "history_redo", Content: null };
    ws?.send(JSON.stringify(msg));
  }

  useEffect(() => {
    if (!canvas.current || !(canvas.current instanceof HTMLCanvasElement))
      return;
    const ctx = canvas.current.getContext("2d", { willReadFrequently: true });
    if (!(ctx instanceof CanvasRenderingContext2D)) return;
    setContext(ctx);
  }, [context]);

  useEffect(() => {
    if (!incomingHistoryChange || !canvas.current || !context) return;
    if (incomingHistoryChange.MsgType === "history_redo") {
      redo(canvas.current, context, history);
    } else if (incomingHistoryChange.MsgType === "history_undo") {
      undo(canvas.current, context, history);
    }
    setIncomingHistoryChange(undefined);
  }, [incomingHistoryChange]);

  useEffect(() => {
    if (!canvas.current || !context) return;
    clearCanvas(canvas.current);
    history.remind().forEach((data) => {
      handleDrawData(data, context, canvas.current!);
    });
    console.log(history);
  }, [history]);

  useEffect(() => {
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
      let incoming: IncomingMsg;
      try {
        incoming = JSON.parse(msg.data);
      } catch (e) {
        if (getId) getId(msg.data);
        return;
      }
      switch (incoming.MsgType) {
        case "drawing": {
          console.log(incoming, typeof incoming.Content);
          const newDrawData = Object.assign(new DrawData([]), incoming.Content);
          setIncomingDrawingData([...incomingDrawingData, newDrawData]);
          break;
        }
        case "history": {
          if (incoming.Content instanceof DrawData) return;
          const newHistory = new History(
            incoming.Content.Actions,
            incoming.Content.RedoArr
          );
          setHistory(newHistory);
          break;
        }
        case "history_redo": {
          setIncomingHistoryChange(incoming);
          break;
        }
        case "history_undo": {
          setIncomingHistoryChange(incoming);
          break;
        }
      }
    });
    setWS(wsocket);
  }, [url]);

  useEffect(() => {
    if (!context || !canvas.current) return;
    for (let i = 0; i < incomingDrawingData.length; i++) {
      const drawData = incomingDrawingData[i];
      handleDrawData(drawData, context, canvas.current);
    }
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
              if (!context || !isPressed) return;
              const coordinates = getCanvasCoordinates(e);
              if (!coordinates) return;
              if (drawMode === 0) {
                context.beginPath();
                if (!prevPos) {
                  setDrawBuffer(
                    new DrawData([], lineWidth, ColorFromHex(color))
                  );
                  context;
                } else {
                  drawLine(
                    coordinates,
                    prevPos,
                    context,
                    lineWidth,
                    ColorFromHex(color)
                  );
                  drawBuffer.addAction("line", prevPos, coordinates);
                }
              }
              if (drawMode === 1 && prevPos == undefined) {
                setDrawingStart(coordinates);
              }
              setPrevPos(coordinates);
            }}
            onMouseLeave={() => {
              setIsPressed(false);
              setPrevPos(null);
              if (!drawBuffer.isEmpty()) {
                drawBuffer.send(sender);
              }
              setDrawBuffer(new DrawData([]));
            }}
            onMouseDown={() => {
              setIsPressed(true);
            }}
            onMouseUp={(e) => {
              if (drawMode === 1 && drawingStart && context) {
                const coordinates = getCanvasCoordinates(e);
                if (coordinates) {
                  drawLine(
                    coordinates,
                    drawingStart,
                    context,
                    lineWidth,
                    ColorFromHex(color)
                  );
                }
                sender(
                  new DrawData([
                    { type: "line", start: coordinates, end: drawingStart },
                  ], lineWidth, ColorFromHex(color))
                );
                setDrawingStart(undefined);
              }

              if (drawMode === 0) {
                drawBuffer.send(sender);
                setDrawBuffer(new DrawData([]));
              }
              setIsPressed(false);
              setPrevPos(null);
            }}
          ></canvas>
        </div>
        <CanvasControl
          colorSetter={colorSetter}
          lineWidthSetter={lineWidthSetter}
          drawModeSetter={drawModeSetter}
          undo={undoOnClick}
          redo={redoOnClick}
        />
      </div>
      <div className="flex m-2">
        <Button
          onClick={() => {
            if (!canvas.current) return;
            clearCanvas(canvas.current);
            const newCommand = new DrawData([{ type: "clear canvas" }]);
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
