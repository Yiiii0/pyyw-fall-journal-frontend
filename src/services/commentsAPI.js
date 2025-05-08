import axios from 'axios';
import { BACKEND_URL } from '../constants';

const API_URL = BACKEND_URL;

// 辅助函数：从localStorage获取当前用户
const getCurrentUser = () => {
  try {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
    return null;
  }
};

// 辅助函数：为请求添加认证头
const getAuthHeaders = () => {
  const currentUser = getCurrentUser();
  const headers = {};
  
  if (currentUser) {
    // 使用用户ID或电子邮件作为身份验证
    headers['X-User-Id'] = currentUser.id || currentUser.email;
    
    // 添加调试信息到请求头（仅用于开发，生产环境应移除）
    if (currentUser.roles) {
      headers['X-User-Roles'] = currentUser.roles.join(',');
    }
  }
  
  return headers;
};

// 带重试的API请求函数
const apiRequestWithRetry = async (method, url, data = null, maxRetries = 2) => {
  const headers = getAuthHeaders();
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries} for ${method} ${url}`);
      }
      
      console.log(`${method} request to ${url}:`, { headers, data });
      
      let response;
      if (method === 'get') {
        response = await axios.get(url, { headers });
      } else if (method === 'put') {
        response = await axios.put(url, data, { headers });
      } else if (method === 'delete') {
        response = await axios.delete(url, { headers });
      }
      
      console.log(`${method} response from ${url}:`, response.data);
      return response.data;
    } catch (error) {
      lastError = error;
      console.error(`${method} request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      
      if (error.response) {
        // 服务器响应错误
        console.error('Server response:', error.response.status, error.response.data);
      }
      
      // 最后一次尝试失败，抛出错误
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 等待一小段时间再重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 不应该运行到这里，但为了类型安全
  throw lastError;
};

export const getCommentsByManuscript = async (manuscriptId) => {
  try {
    return await apiRequestWithRetry('get', `${API_URL}/comment/manuscript/${manuscriptId}`);
  } catch (error) {
    console.error('Error fetching comments for manuscript:', error);
    // 出错时返回空数组而不是抛出错误，这样UI不会崩溃
    return [];
  }
};

export const createComment = async (manuscriptId, editorId, text) => {
  const data = {
    manuscript_id: manuscriptId,
    editor_id: editorId,
    text: text
  };
  
  try {
    // 首先以正常方式创建评论
    return await apiRequestWithRetry('put', `${API_URL}/comment/create`, data);
  } catch (error) {
    // 特殊处理：如果获得403错误（权限问题），尝试使用备选方法
    if (error.response && error.response.status === 403) {
      console.warn('Permission error creating comment. Attempting different approach...');
      
      // 添加当前用户角色信息到评论数据中，帮助服务器调试
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.roles) {
        data.roles = currentUser.roles.join(',');
      }
      
      // 重试
      return await apiRequestWithRetry('put', `${API_URL}/comment/create`, data);
    }
    
    // 其他错误直接抛出
    throw error;
  }
};

export const updateComment = async (commentId, text) => {
  return await apiRequestWithRetry('put', `${API_URL}/comment/update`, {
    _id: commentId,
    text: text
  });
};

export const deleteComment = async (commentId) => {
  return await apiRequestWithRetry('delete', `${API_URL}/comment/${commentId}`);
}; 