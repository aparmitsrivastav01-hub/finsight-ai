import { fetchUtils } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const httpClient = (url: string, options: any = {}) => {
  const token = localStorage.getItem('token');
  options.headers = new Headers({
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
  return fetchUtils.fetchJson(url, options);
};

const dataProvider = simpleRestProvider(`${apiUrl}/admin`, httpClient);

export default dataProvider;
