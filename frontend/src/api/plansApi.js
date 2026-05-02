import axiosInstance from "./axiosInstance";

const BASE = "/plans/admin";

const plansApi = {
  list: ()            => axiosInstance.get(`${BASE}/`),
  get: (id)           => axiosInstance.get(`${BASE}/${id}/`),
  create: (data)      => axiosInstance.post(`${BASE}/`, data),
  update: (id, data)  => axiosInstance.patch(`${BASE}/${id}/`, data),
  remove: (id)        => axiosInstance.delete(`${BASE}/${id}/`),
  toggle: (id)        => axiosInstance.post(`${BASE}/${id}/toggle/`),
  toggleFeatured: (id)=> axiosInstance.post(`${BASE}/${id}/toggle-featured/`),
};

export default plansApi;
