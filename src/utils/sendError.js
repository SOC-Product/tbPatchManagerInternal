export const sendErrorResponse = (status = 400, message = 'Internal server error') => {
    return {
        status: status,
        message: message
    }
}