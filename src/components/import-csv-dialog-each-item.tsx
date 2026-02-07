import { SharedDialogButton } from "./SharedDialogButton";
import { SharedDialogWrapper } from "./SharedDialogWrapper";
import { SharedLoader } from "./SharedLoader";
import { useTranslateWrapper } from "../translateWrapper";
import { Check, Plus, Undo2, X } from "lucide-react";

interface ImportCsvDialogEachItemProps {
  disableImportNew: boolean;
  disableImportOverwrite: boolean;
  currentValue: any;
  resourceName: string;
  values: any[];
  fileName: string;
  openAskDecide: boolean;
  handleClose: () => any;
  handleAskDecideReplace: () => any;
  handleAskDecideAddAsNew: () => any;
  handleAskDecideSkip: () => any;
  handleAskDecideSkipAll: () => any;
  isLoading: boolean;
  idsConflicting: string[];
}

export const ImportCsvDialogEachItem = (props: ImportCsvDialogEachItemProps) => {
  const {
    disableImportNew,
    disableImportOverwrite,
    currentValue,
    resourceName,
    values,
    fileName,
    openAskDecide,
    handleClose,
    handleAskDecideReplace,
    handleAskDecideAddAsNew,
    handleAskDecideSkip,
    handleAskDecideSkipAll,
    isLoading,
    idsConflicting,
  } = props;
  const translate = useTranslateWrapper();

  return (
    <SharedDialogWrapper
      title={translate("csv.dialogDecide.title", {
        id: currentValue && currentValue.id,
        resource: resourceName,
      })}
      subTitle={translate("csv.dialogCommon.subtitle", {
        count: values && values.length,
        fileName: fileName,
        resource: resourceName,
      })}
      open={openAskDecide}
      handleClose={handleClose}
    >
      {isLoading && <SharedLoader loadingTxt={translate("csv.loading")} />}
      {!isLoading && (
        <div className="space-y-3">
          <p
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: translate("csv.dialogCommon.conflictCount", {
                resource: resourceName,
                conflictingCount: idsConflicting && idsConflicting.length,
              }),
            }}
          />
          <div className="flex flex-col gap-2">
            <SharedDialogButton
              disabled={disableImportOverwrite}
              onClick={handleAskDecideReplace}
              icon={<Check className="size-4 text-green-500" />}
              label={translate("csv.dialogDecide.buttons.replaceRow", {
                id: currentValue && currentValue.id,
              })}
            />
            <SharedDialogButton
              disabled={disableImportNew}
              onClick={handleAskDecideAddAsNew}
              icon={<Plus className="size-4 text-blue-500" />}
              label={translate("csv.dialogDecide.buttons.addAsNewRow")}
            />
            <SharedDialogButton
              onClick={handleAskDecideSkip}
              icon={<Undo2 className="size-4" />}
              label={translate("csv.dialogDecide.buttons.skipDontReplace")}
            />
            <SharedDialogButton
              onClick={handleAskDecideSkipAll}
              icon={<X className="size-4 text-blue-500" />}
              label={translate("csv.dialogCommon.buttons.cancel")}
            />
          </div>
        </div>
      )}
    </SharedDialogWrapper>
  );
};
