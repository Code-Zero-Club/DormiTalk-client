const axios = require('axios');
const axiosRetry = require('axios-retry').default;

const API_BASE_URL = 'https://api-dormitalk.codezero.lol/api';

// Create axios instance with custom config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000  // 타임아웃을 10초로 증가
});

// Configure retry logic
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => {
    return axiosRetry.exponentialDelay(retryCount) + 2000; // 기본 지수 백오프에 2초 추가
  },
  retryCondition: (error) => {
    // 타임아웃과 네트워크 에러에 대해 재시도
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) || 
      error.code === 'EAI_AGAIN' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT'
    );
  },
  shouldResetTimeout: true,  // 재시도할 때 타임아웃을 리셋
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`[APISyncService] ${error.code} 에러가 발생했습니다. ${requestConfig.url} 에 대해 재시도합니다. (${retryCount}회)`);
  }
});

const getSongs = async () => {
  try {
    const response = await apiClient.get('/songs');
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out after all retry attempts');
    } else {
      console.error('Error fetching songs:', error);
    }
    throw error;
  }
};

const getSong = async (id) => {
  try {
    const response = await apiClient.get(`/songs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching song with id ${id}:`, error);
    throw error;
  }
};

const createSong = async (songData, adminKey) => {
  try {
    const response = await apiClient.post('/songs', songData, {
      headers: { 'Authorization': `Bearer ${adminKey}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating song:', error);
    throw error;
  }
};

const getSchedulers = async () => {
  try {
    const response = await apiClient.get('/schedulers');
    return response.data;
  } catch (error) {
    console.error('Error fetching schedulers:', error);
    throw error;
  }
};

const createScheduler = async (schedulerData, adminKey) => {
  try {
    const response = await apiClient.post('/schedulers', schedulerData, {
      headers: { 'Authorization': `Bearer ${adminKey}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating scheduler:', error);
    throw error;
  }
};

const updateScheduler = async (id, schedulerData, adminKey) => {
  try {
    const response = await apiClient.put(`/schedulers/${id}`, schedulerData, {
      headers: { 'Authorization': `Bearer ${adminKey}` }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating scheduler with id ${id}:`, error);
    throw error;
  }
};

const checkKey = async (key) => {
  try {
    const response = await apiClient.get('/auth/key', {
      params: { key }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking key:', error);
    throw error;
  }
};

const generateKey = async (keyData) => {
  try {
    const response = await apiClient.post('/admin/key', keyData);
    return response.data;
  } catch (error) {
    console.error('Error generating key:', error);
    throw error;
  }
};

module.exports = {
  getSongs,
  getSong,
  createSong,
  getSchedulers,
  createScheduler,
  updateScheduler,
  checkKey,
  generateKey
};