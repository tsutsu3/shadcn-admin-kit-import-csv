import React, { useEffect } from "react";
import { SharedDialogWrapper } from "./SharedDialogWrapper";
import { SharedLoader } from "./SharedLoader";
import { SharedDialogButton } from "./SharedDialogButton";
import { useTranslateWrapper } from "../translateWrapper";
import { Check, Copy, Undo2 } from "lucide-react";

interface ImportCsvDialogStrategyProps {
  disableImportOverwrite: boolean;
  resourceName: string;
  fileName: string;
  count: number;
  handleClose: () => any;
  handleReplace: () => any;
  handleSkip: () => any;
  handleAskDecide: () => any;
  open: boolean;
  isLoading: boolean;
  idsConflicting: string[];
}

interface MessageState {
  title: string;
  subTitle: string;
  loadingTxt: string;
  labelSkip: string;
  labelReplace: string;
  labelDecide: string;
  messageHtml: string;
}

export const ImportCsvDialogStrategy = (props: ImportCsvDialogStrategyProps) => {
  const {
    count,
    disableImportOverwrite,
    resourceName,
    fileName,
    handleClose,
    handleReplace,
    handleSkip,
    handleAskDecide,
    open,
    isLoading,
    idsConflicting,
  } = props;
  const [messages, setMessages] = React.useState({} as MessageState);
  const translate = useTranslateWrapper();

  useEffect(() => {
    setMessages({
      title: translate("csv.dialogImport.title", {
        resource: resourceName,
      }),
      subTitle: translate("csv.dialogCommon.subtitle", {
        count: count,
        fileName: fileName,
        resource: resourceName,
      }),
      loadingTxt: translate("csv.loading"),
      labelSkip: translate("csv.dialogImport.buttons.skipAllConflicts"),
      labelReplace: translate("csv.dialogImport.buttons.replaceAllConflicts"),
      labelDecide: translate("csv.dialogImport.buttons.letmeDecide"),
      messageHtml: translate("csv.dialogCommon.conflictCount", {
        resource: resourceName,
        conflictingCount: idsConflicting && idsConflicting.length,
      }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, resourceName, fileName, idsConflicting]);

  return (
    <SharedDialogWrapper
      title={messages.title}
      subTitle={messages.subTitle}
      open={open}
      handleClose={handleClose}
    >
      {isLoading && <SharedLoader loadingTxt={messages.loadingTxt} />}
      {idsConflicting && idsConflicting.length > 0 && !isLoading && (
        <div className="space-y-3">
          <p
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: messages.messageHtml,
            }}
          />
          <div className="flex flex-col gap-2">
            <SharedDialogButton
              disabled={disableImportOverwrite}
              onClick={handleReplace}
              icon={<Check className="size-4 text-green-500" />}
              label={messages.labelReplace}
            />
            <SharedDialogButton
              onClick={handleSkip}
              icon={<Copy className="size-4 text-blue-500" />}
              label={messages.labelSkip}
            />
            <SharedDialogButton
              onClick={handleAskDecide}
              icon={<Undo2 className="size-4" />}
              label={messages.labelDecide}
            />
          </div>
        </div>
      )}
    </SharedDialogWrapper>
  );
};
