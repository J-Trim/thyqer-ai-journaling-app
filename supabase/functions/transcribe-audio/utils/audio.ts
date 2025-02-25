
export const getMimeType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  console.log('Detecting MIME type for extension:', extension);
  
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'webm':
      return 'audio/webm';
    default:
      console.log('Using default MIME type for unknown extension:', extension);
      return 'audio/webm'; // Default to webm as it's our primary format
  }
};

export const sanitizeFileName = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};
