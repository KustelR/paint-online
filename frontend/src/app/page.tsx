"use client";

import React, { useState } from "react";

import Image from "next/image";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Canvas from "@/components/Canvas";

const url = "ws://localhost:8079";

type Canvas = {
  id: string;
};

export default function Home() {
  const [canvases, setCanvases] = useState<Array<Canvas>>([]);
  const [newId, setNewId] = useState<string>("");

  return (
    <main className="">
      <Header></Header>
      <div className="flex justify-between mx-2">
        <Canvas url="ws://localhost:8079"></Canvas>
        <ul>
          {canvases.map((canvas) => {
            return (
              <li>
                <Canvas url={url} id={canvas.id}></Canvas>
              </li>
            );
          })}
        </ul>
        <div className="block">
          <input
            onChange={(e) => {
              setNewId(e.target.value);
            }}
            className="bg-neutral-200"
            type="text"
          />
          <Button
            onClick={() => {
                setCanvases([...canvases, { id: newId }]);
            }}
          >
            ADD
          </Button>
        </div>
      </div>
    </main>
  );
}
