export const sendSuccessResponse = (status = 200, message = 'Success', data = null) => {
    return {
        status: status,
        message: message,
        data: data || null
    }
}