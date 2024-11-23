const axios = require('axios');

const API_BASE_URL = 'http://112.164.145.34:5000/api';

const getSongs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/songs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
};

const getSong = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/songs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching song with id ${id}:`, error);
    throw error;
  }
};

const createSong = async (songData, adminKey) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/songs`, songData, {
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
    const response = await axios.get(`${API_BASE_URL}/schedulers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching schedulers:', error);
    throw error;
  }
};

const createScheduler = async (schedulerData, adminKey) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/schedulers`, schedulerData, {
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
    const response = await axios.put(`${API_BASE_URL}/schedulers/${id}`, schedulerData, {
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
    const response = await axios.get(`${API_BASE_URL}/auth/key`, {
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
    const response = await axios.post(`${API_BASE_URL}/admin/key`, keyData);
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
