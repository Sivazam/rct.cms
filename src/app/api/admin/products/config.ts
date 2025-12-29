import { NextRequest } from 'next/server';

// Configuration for handling large file uploads and form data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase body size limit to 50mb
    },
  },
};

// Helper function to handle large form data
export async function parseLargeFormData(request: NextRequest) {
  try {
    const formData = await request.formData();
    return formData;
  } catch (error) {
    console.error('Error parsing form data:', error);
    throw new Error('Failed to parse form data');
  }
}