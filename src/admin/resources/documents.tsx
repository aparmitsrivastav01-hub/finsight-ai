import {
  List,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  NumberField,
  DeleteButton,
} from 'react-admin';

export const DocumentList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="filename" />
      <NumberField source="size" />
      <BooleanField source="is_indexed" />
      <DateField source="created_at" />
      <TextField source="user_id" />
      <DeleteButton />
    </Datagrid>
  </List>
);
