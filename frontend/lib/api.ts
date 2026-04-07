import axios from "axios";

const apiUrl = process.env.API_URL;

if (!apiUrl) {
  throw new Error("API_URL environment variable is not set");
}

const api = axios.create({
  baseURL: apiUrl,
});

export default api;
