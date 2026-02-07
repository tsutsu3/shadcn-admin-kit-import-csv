import React from "react";
import { Button } from "../ui/button";

export function SharedDialogButton(props: {
  onClick: () => void;
  icon: React.ReactElement;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-3 px-4 py-3 h-auto"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.icon}
      <span className="text-left">{props.label}</span>
    </Button>
  );
}
