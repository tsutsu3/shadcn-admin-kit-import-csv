import {
  List,
  DataTable,
  Show,
  Create,
  Edit,
  SimpleForm,
  TextInput,
  RecordField,
  CreateButton,
  ExportButton,
} from "@/components/admin";
import { ImportButton } from "shadcn-admin-kit-import-csv";

const validateRow = async (row: any) => {
  if (row.title == null || row.title === "") {
    throw new Error("CSV must contain a 'title' column");
  }
};

const ListActions = () => (
  <div className="flex items-center gap-2">
    <CreateButton />
    <ExportButton />
    <ImportButton logging parseConfig={{ dynamicTyping: true }} />
    <ImportButton
      logging
      parseConfig={{ dynamicTyping: true }}
      label="Import (validated)"
      validateRow={validateRow}
    />
  </div>
);

export const PostList = () => (
  <List actions={<ListActions />}>
    <DataTable>
      <DataTable.Col source="id" />
      <DataTable.Col source="title" />
    </DataTable>
  </List>
);

export const PostShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="id" />
      <RecordField source="title" />
    </div>
  </Show>
);

export const PostCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="id" />
      <TextInput source="title" />
    </SimpleForm>
  </Create>
);

export const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput disabled source="id" />
      <TextInput source="title" />
    </SimpleForm>
  </Edit>
);
