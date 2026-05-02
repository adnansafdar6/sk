/**
 * Category API — CRUD operations for categories.
 */
import axiosInstance from "./axiosInstance";

const BASE = "/categories";

export const categoryApi = {
  list: () => axiosInstance.get(`${BASE}/`),
  get: (id) => axiosInstance.get(`${BASE}/${id}/`),
  create: (data) => axiosInstance.post(`${BASE}/`, data),
  update: (id, data) => axiosInstance.patch(`${BASE}/${id}/`, data),
  delete: (id) => axiosInstance.delete(`${BASE}/${id}/`),
};
