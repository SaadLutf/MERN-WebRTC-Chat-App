import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
});

// Request Interceptor
API.interceptors.request.use((req) => {
  // Skip token if noAuth flag is set
  if (req.noAuth) return req;

  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;

  return req;
});

export default API;
