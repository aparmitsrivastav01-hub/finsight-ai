import { Admin, Resource } from 'react-admin';
import dataProvider from './dataProvider';
import authProvider from './authProvider';
import { UserList, UserEdit } from './resources/users';
import { DocumentList } from './resources/documents';
import { QueryList } from './resources/queries';

const AdminApp = () => (
  <Admin
    basename="/admin"
    dataProvider={dataProvider}
    authProvider={authProvider}
  >
    <Resource name="users" list={UserList} edit={UserEdit} />
    <Resource name="documents" list={DocumentList} />
    <Resource name="queries" list={QueryList} />
  </Admin>
);

export default AdminApp;
