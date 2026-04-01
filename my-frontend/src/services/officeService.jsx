import axios from 'axios';

// officeService.jsx - Cập nhật
const API_URL = 'http://localhost:5000/api/offices';

const officeService = {
  getAll: async (params = {}) => {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data; // backend trả về { success: true, data: [...] }
    } catch (error) {
      throw error;
    }
  },
  
  getStats: async () => {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },
  
  create: async (officeData) => {
    const response = await axios.post(API_URL, officeData);
    return response.data;
  },
  
  update: async (id, officeData) => {
    const response = await axios.put(`${API_URL}/${id}`, officeData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  }
};

export default officeService; // DÒNG NÀY ĐANG CÓ