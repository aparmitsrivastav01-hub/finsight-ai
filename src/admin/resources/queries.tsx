import {
  List,
  Datagrid,
  TextField,
  DateField,
  DeleteButton,
} from 'react-admin';

export const QueryList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="user_id" />
      <TextField source="company_name" />
      <TextField source="query" />
      <TextField source="analysis_type" />
      <TextField source="response_summary" />
      <TextField source="document_id" />
      <DateField source="created_at" />
      <DeleteButton />
    </Datagrid>
  </List>
);
