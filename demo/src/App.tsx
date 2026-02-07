import { Admin } from "@/components/admin";
import { Resource } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";
import { PostList, PostShow, PostEdit, PostCreate } from "./posts";

const dataProvider = fakeDataProvider({
  posts: [
    { id: 1, title: "FooBar" },
    { id: 2, title: "Another" },
    { id: 3, title: "Thing" },
    { id: 4, title: "Hello, world!" },
  ],
});

export default function App() {
  return (
    <Admin dataProvider={dataProvider}>
      <Resource
        name="posts"
        list={PostList}
        show={PostShow}
        edit={PostEdit}
        create={PostCreate}
      />
    </Admin>
  );
}
