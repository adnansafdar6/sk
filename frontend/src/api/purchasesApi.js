import axiosInstance from "./axiosInstance";

const BASE = "/plans/admin/purchases";

const purchasesApi = {
  list:    ()               => axiosInstance.get(`${BASE}/`),
  confirm: (id, adminNote)  => axiosInstance.post(`${BASE}/${id}/confirm/`, { admin_note: adminNote }),
  reject:  (id, adminNote)  => axiosInstance.post(`${BASE}/${id}/reject/`,  { admin_note: adminNote }),
};

export default purchasesApi;
