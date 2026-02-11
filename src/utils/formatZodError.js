

export const formatZodErrors = (zodError) => {

    const formatted = zodError.format();
   
    return Object.entries(formatted).reduce((acc, [key, value]) => {
  
      if (key !== "_errors") {
  
        acc[key] = value._errors;
  
      }
  
      return acc;
  
    }, {});
  
  };
   
  export const formatZodErrorsArray = (zodError) => {
    const formatted = zodError.format();
  
    return Object.entries(formatted)
      .filter(([key]) => key !== "_errors")
      .reduce((acc, [index, value]) => {
        acc[index] = Object.entries(value)
          .filter(([k]) => k !== "_errors")
          .reduce((fieldErrors, [field, fieldValue]) => {
            fieldErrors[field] = fieldValue._errors;
            return fieldErrors;
          }, {});
        return acc;
      }, {});
};
  