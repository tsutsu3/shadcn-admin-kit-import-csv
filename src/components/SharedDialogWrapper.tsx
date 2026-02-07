import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

export function SharedDialogWrapper(props: {
  open: boolean;
  title: string;
  subTitle: string;
  handleClose: () => any;
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.subTitle}</DialogDescription>
        </DialogHeader>
        <div className="max-w-full">{props.children}</div>
      </DialogContent>
    </Dialog>
  );
}
