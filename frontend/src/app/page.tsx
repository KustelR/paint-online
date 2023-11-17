"use client";

import React, { useState } from "react";

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
    <main className="min-w-fit">
      <div className="border border-neutral-400 w-fit p-2 m-4">
        <h2 className="font-bold">Create new canvas</h2>
        <form action="/canvas" rel="opener">
          <label className="block" htmlFor="h">Height</label>
          <input className="bg-neutral-100" name="h" type="text" />
          <label className="block" htmlFor="w">Width</label>
          <input className="bg-neutral-100" name="w" type="text" />
          <Button className="block mt-2">CREATE</Button>
        </form>
      </div>
    </main>
  );
}
