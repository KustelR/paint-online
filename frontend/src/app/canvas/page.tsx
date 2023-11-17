'use client'

import React, {useState, useEffect, useRef} from "react";
import Canvas from "@/components/Canvas";
import { useSearchParams } from "next/navigation";

type Props = {};

export default function page({}: Props) {
    const [newId, setNewId] = useState<null | string>(null)
    const linkInput = useRef<null | HTMLTextAreaElement>(null)
    const params = useSearchParams();
    const width = Number(params.get("w"));
    const height = Number(params.get("h"));
    const id = params.get("id");

    useEffect(() => {
        if (!linkInput || !linkInput.current) return
        if (id && !newId) {
        linkInput.current.value = `http://localhost:3000/canvas?w=${width}&h=${height}&id=${id}`;
        return
        }
        linkInput.current.value = `http://localhost:3000/canvas?w=${width}&h=${height}&id=${newId}`;
    }, [newId])

  return (
    <div className="md:px-4 py-4 max-w-fit">
      <div>
         <Canvas url="ws://localhost:8079" height={height} width={width} id={id ? id : undefined} getId={(id) => {
            setNewId(id);
        }}></Canvas>
      </div>
        <div className="mt-4 w-full p-2 border-neutral-200 border border-t-4 border-t-cyan-500">
          <h2>Generate link</h2>
          <textarea ref={linkInput} className="text-xl bg-neutral-100 h-fit w-full" />
          <p>Send this link so people can join you!</p>
        </div>
    </div>
  );
}
