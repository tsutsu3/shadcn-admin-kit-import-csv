import { Loader2 } from "lucide-react";

export function SharedLoader(props: { loadingTxt: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{props.loadingTxt}</p>
    </div>
  );
}
