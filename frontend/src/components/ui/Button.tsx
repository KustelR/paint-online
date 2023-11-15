import React, { MouseEventHandler } from "react";

type Props = {
  children: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export default function Button(props: Props) {
  const { children, className, onClick } = props;
  return (
    <button
    onClick={onClick}
      className={
        "bg-black text-white p-2 hover:bg-opacity-60 transition-all " +
        (className ? className : "")
      }
    >
      {children}
    </button>
  );
}
