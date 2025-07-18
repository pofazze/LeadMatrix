import axios from 'axios';

// Lê a variável de ambiente do Vite.
// Em produção, usará a URL da Railway. Em dev, será uma string vazia para o proxy funcionar.
const API_BASE_URL = import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL : '';

// Cria uma instância do axios com a baseURL pré-configurada
const apiClient = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor para adicionar o token de autenticação a todas as requisições
// Isso centraliza a lógica do token que antes estava no AuthContext
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});


export default apiClient;