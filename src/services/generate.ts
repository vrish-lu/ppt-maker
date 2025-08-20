import axios from 'axios';
import type { GenerateRequest, GenerateResponse, GenerateImageRequest, GenerateImageResponse } from '../types';

const generateSlides = async (data: GenerateRequest): Promise<GenerateResponse> => {
  const response = await axios.post('/api/generate', data);
  return response.data;
};

const generateImage = async (data: GenerateImageRequest): Promise<GenerateImageResponse> => {
  const response = await axios.post('/api/generate-image', data);
  return response.data;
};

export default {
  generateSlides,
  generateImage,
}; 