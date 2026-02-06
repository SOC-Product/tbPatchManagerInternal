

export const formatZodErrors = (zodError) => {

    const formatted = zodError.format();
   
    return Object.entries(formatted).reduce((acc, [key, value]) => {
  
      if (key !== "_errors") {
  
        acc[key] = value._errors;
  
      }
  
      return acc;
  
    }, {});
  
  };
   