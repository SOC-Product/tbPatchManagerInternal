export const validateCreateHost = (hostData) => {
    if (!hostData || !hostData.computer_name?.trim()) {
      return 'Host name is required';
    }
  
    if (hostData.computer_name.trim().length > 255) {
      return 'Host name must be 255 characters or less';
    }
  
    if (hostData.ip && hostData.ip.trim().length > 255) {
      return 'IP must be 255 characters or less';
    }
  
    return null;
  };
  