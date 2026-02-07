# shadcn-admin-kit-import-csv

[![NPM Version](https://img.shields.io/npm/v/shadcn-admin-kit-import-csv.svg)](https://www.npmjs.com/package/shadcn-admin-kit-import-csv)
[![License](https://img.shields.io/npm/l/shadcn-admin-kit-import-csv.svg)](https://github.com/tsutsu3/shadcn-admin-kit-import-csv/blob/main/LICENSE)

CSV/TSV import button for [react-admin](https://github.com/marmelab/react-admin) using **shadcn/ui** + **Tailwind CSS**.

A fork of [react-admin-import-csv](https://github.com/benwinding/react-admin-import-csv) with Material UI replaced by [shadcn/ui](https://ui.shadcn.com/) components (Radix UI + Tailwind CSS).

## Features

- Import CSV/TSV files into any react-admin resource
- Collision detection — skip, replace, or decide per row
- Bulk operations via `createMany` / `updateManyArray` with fallback
- Built-in i18n (en, ja, de, es, fr, zh, ru, nl, pl, ptBR)
- shadcn/ui Dialog, Button, Tooltip components
- Tailwind CSS styling — no Material UI dependency

## Installation

```bash
npm install shadcn-admin-kit-import-csv
# or
pnpm add shadcn-admin-kit-import-csv
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom ra-core papaparse lucide-react \
  @radix-ui/react-dialog @radix-ui/react-tooltip @radix-ui/react-slot \
  class-variance-authority clsx tailwind-merge
```

## Usage

### Basic

```tsx
import { Datagrid, List, TextField, TopToolbar, CreateButton, ExportButton } from "react-admin";
import { ImportButton } from "shadcn-admin-kit-import-csv";

const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
    <ImportButton />
  </TopToolbar>
);

export const PostList = () => (
  <List actions={<ListActions />}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="title" />
    </Datagrid>
  </List>
);
```

### With Configuration

```tsx
import { ImportButton, ImportConfig } from "shadcn-admin-kit-import-csv";

const config: ImportConfig = {
  logging: true,
  parseConfig: { dynamicTyping: true },
  validateRow: async (row) => {
    if (!row.title) throw new Error("Title is required");
  },
  preCommitCallback: async (action, values) => {
    console.log(`Action: ${action}, Count: ${values.length}`);
    return values;
  },
  postCommitCallback: (reportItems) => {
    console.log("Import result:", reportItems);
  },
};

const ListActions = () => (
  <TopToolbar>
    <ImportButton {...config} />
  </TopToolbar>
);
```

## Configuration Options

```typescript
interface ImportConfig {
  // Enable logging
  logging?: boolean;
  // Disable "createMany" (uses "create" per item instead)
  disableCreateMany?: boolean;
  // Disable "updateMany" (uses "update" per item instead)
  disableUpdateMany?: boolean;
  // Disable "getMany" (uses "getOne" per item instead)
  disableGetMany?: boolean;
  // Disable "import new" button
  disableImportNew?: boolean;
  // Disable "import overwrite" button
  disableImportOverwrite?: boolean;
  // Transform values before create/update
  preCommitCallback?: (action: "create" | "overwrite", values: any[]) => Promise<any[]>;
  // Handle errors after import
  postCommitCallback?: (error: any) => void;
  // Transform CSV rows before processing
  transformRows?: (csvRows: any[]) => Promise<any[]>;
  // Validate each row (reject promise to fail)
  validateRow?: (csvRowItem: any, index?: any, allItems?: any[]) => Promise<void>;
  // papaparse config: https://www.papaparse.com/docs#config
  parseConfig?: ParseConfig;
}
```

## Bulk Operations

Your DataProvider can implement optional bulk methods to reduce API calls:

| Operation | Bulk Method | Fallback |
| --- | --- | --- |
| Create | `.createMany()` | `.create()` per item |
| Update | `.updateManyArray()` | `.update()` per item |
| Check existing | `.getMany()` | `.getOne()` per item |

```typescript
interface CreateManyParams {
  data: any[];
}

interface UpdateManyArrayParams {
  ids: Identifier[];
  data: any[];
}
```

## i18n

This package includes built-in translations and falls back to English if no translation is found. To use translations with react-admin's i18n system:

```tsx
import { i18n } from "shadcn-admin-kit-import-csv";

const messages = {
  en: { ...englishMessages, ...i18n.en },
  ja: { ...japaneseMessages, ...i18n.ja },
};
```

Supported languages: English (en), Japanese (ja), German (de), Spanish (es), French (fr), Chinese (zh), Brazilian Portuguese (ptBR), Russian (ru), Dutch (nl), Polish (pl)

## Development

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Run tests
pnpm test

# Build
pnpm build
```

## Credits

This project is a fork of [react-admin-import-csv](https://github.com/benwinding/react-admin-import-csv) by [Ben Winding](https://github.com/benwinding), with Material UI components replaced by shadcn/ui.

## License

[MIT](LICENSE) - Copyright (c) 2020 Ben Winding, 2025 tsutsu3
