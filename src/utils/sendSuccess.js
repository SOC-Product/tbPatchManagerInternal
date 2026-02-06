export const sendSuccessResponse = (status = 200, message = 'Success', data = null) => {
    return {
        status: status,
        message: message,
        data: data || null
    }
}

export const sendSuccessPagination = (status = 200, message = 'Success', data = null ,limit, page, total) =>{

    return {
        status: status,
        message: message,
        data: data || null,
        pagination: {
            page: page,
            limit: limit,
            total: total
        }
    }
}