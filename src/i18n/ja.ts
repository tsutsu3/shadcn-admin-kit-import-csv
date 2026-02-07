export default {
  csv: {
    buttonMain: {
      label: "インポート",
      tooltip: "'.csv' または '.tsv' ファイルを選択してください",
      emptyResource:
        "'resource' プロパティが空です。ImportButton に {...props} を渡していますか？",
    },
    parsing: {
      collidingIds: "重複する ID フィールドが見つかりました",
      failedValidateRow: "CSV がバリデーション要件を満たしていません",
      invalidCsvDocument:
        "このドキュメントは CSV ファイルとして解析できませんでした",
    },
    dialogCommon: {
      subtitle:
        '%{fileName} から "%{resource}" へ %{count} 件のデータをインポート',
      conflictCount:
        "リソース <strong>%{resource}</strong> には <strong>%{conflictingCount}</strong> 件の ID が重複するレコードがあります",
      buttons: {
        cancel: "キャンセル",
      },
    },
    dialogImport: {
      alertClose: "%{fname} をインポートしました",
      title: '"%{resource}" へインポート',
      buttons: {
        replaceAllConflicts: "行を置換する",
        skipAllConflicts: "これらの行をスキップする",
        letmeDecide: "各行ごとに判断する",
      },
    },
    dialogDecide: {
      title: 'ID %{id} を "%{resource}" へインポート',
      buttons: {
        replaceRow: "行 id=%{id} を置換する",
        addAsNewRow: "新しい行として追加する（置換しない）",
        skipDontReplace: "この行をスキップする（置換しない）",
      },
    },
    loading: "読み込み中...",
  },
};
