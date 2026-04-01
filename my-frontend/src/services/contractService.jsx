// services/contractService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ContractService {
  
  // Lấy tất cả hợp đồng
  async getAllContracts() {
    try {
      const response = await fetch(`${API_URL}/contracts`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi lấy danh sách hợp đồng');
      }
      
      // Backend trả về trực tiếp mảng contracts
      return data; // Không cần .data vì backend trả về trực tiếp mảng
    } catch (error) {
      console.error('Get all contracts error:', error);
      throw error;
    }
  }

  // Thêm hợp đồng mới
  async addContract(contractData) {
    try {
      const formData = new FormData();
      
      // Log để kiểm tra dữ liệu
      console.log('Contract data to send:', contractData);
      
      // Thêm các trường dữ liệu vào FormData
      Object.keys(contractData).forEach(key => {
        if (key === 'attachments' && contractData[key]?.length > 0) {
          // Thêm từng file vào FormData
          contractData[key].forEach(file => {
            formData.append('attachments', file);
            console.log('Appending file:', file.name);
          });
        } else if (contractData[key] !== undefined && contractData[key] !== null) {
          // Chỉ thêm các trường không phải undefined/null
          formData.append(key, contractData[key].toString());
          console.log(`Appending ${key}:`, contractData[key].toString());
        }
      });

      const response = await fetch(`${API_URL}/contracts`, {
        method: 'POST',
        body: formData
        // Không cần set Content-Type, fetch tự động set với boundary cho FormData
      });

      const data = await response.json();
      console.log('Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi tạo hợp đồng');
      }

      return data; // Backend trả về { success, message, contract }
    } catch (error) {
      console.error('Add contract error:', error);
      throw error;
    }
  }

  // Cập nhật hợp đồng
  async updateContract(id, contractData) {
    try {
      const formData = new FormData();
      
      Object.keys(contractData).forEach(key => {
        if (key === 'attachments' && contractData[key]?.length > 0) {
          contractData[key].forEach(file => {
            formData.append('attachments', file);
          });
        } else if (contractData[key] !== undefined && contractData[key] !== null) {
          formData.append(key, contractData[key].toString());
        }
      });

      const response = await fetch(`${API_URL}/contracts/${id}`, {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi cập nhật hợp đồng');
      }

      return data;
    } catch (error) {
      console.error('Update contract error:', error);
      throw error;
    }
  }

  // Cập nhật trạng thái hợp đồng
  async updateContractStatus(id, status, endDate = null) {
    try {
      const body = { status };
      if (endDate) {
        body.endDate = endDate;
      }

      const response = await fetch(`${API_URL}/contracts/${id}/status`, {
        method: 'PUT', // Backend dùng PUT, không phải PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi cập nhật trạng thái');
      }

      return data;
    } catch (error) {
      console.error('Update status error:', error);
      throw error;
    }
  }

  // Kiểm tra và cập nhật trạng thái tự động
  async checkAndUpdateStatus() {
    try {
      const response = await fetch(`${API_URL}/contracts/check-status`, {
        method: 'POST' // Backend dùng POST cho action này
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi kiểm tra trạng thái');
      }

      return data; // Trả về { updatedCount, updatedIds }
    } catch (error) {
      console.error('Check status error:', error);
      throw error;
    }
  }

  // Tìm kiếm hợp đồng
  async searchContracts(searchTerm) {
    try {
      // Backend dùng params, không phải path variable
      const url = new URL(`${API_URL}/contracts/search`);
      url.searchParams.append('q', searchTerm);
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi tìm kiếm');
      }

      return data; // Trả về mảng contracts đã tìm kiếm
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Lấy chi tiết hợp đồng
  async getContractById(id) {
    try {
      const response = await fetch(`${API_URL}/contracts/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi lấy chi tiết hợp đồng');
      }

      return data; // Trả về chi tiết contract
    } catch (error) {
      console.error('Get contract detail error:', error);
      throw error;
    }
  }

  // Xóa hợp đồng
  async deleteContract(id) {
    try {
      const response = await fetch(`${API_URL}/contracts/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi xóa hợp đồng');
      }

      return data; // Trả về { success, message }
    } catch (error) {
      console.error('Delete contract error:', error);
      throw error;
    }
  }

  // Lấy thống kê
  async getContractStats() {
    try {
      const response = await fetch(`${API_URL}/contracts/stats/summary`); // Đúng endpoint từ routes
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi lấy thống kê');
      }

      return data; // Trả về stats object
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }
}

export default new ContractService();