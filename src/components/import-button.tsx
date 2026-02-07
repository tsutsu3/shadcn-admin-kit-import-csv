import React from "react";
import { Upload } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useTranslateWrapper } from "../translateWrapper";

interface ImportButtonUIProps {
  label: string;
  clickImportButton: () => any;
  onFileAdded: (e: React.ChangeEvent<HTMLInputElement>) => any;
  onRef: (el: HTMLInputElement) => any;
}

export function ImportButtonUI(props: ImportButtonUIProps) {
  const { label, clickImportButton, onFileAdded, onRef } = props;
  const translate = useTranslateWrapper();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="sm" onClick={clickImportButton}>
          <Upload className="size-4" />
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{translate("csv.buttonMain.tooltip")}</p>
      </TooltipContent>
      <input ref={onRef} type="file" className="hidden" onChange={onFileAdded} accept=".csv,.tsv" />
    </Tooltip>
  );
}
