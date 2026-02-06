export const asyncTryCatch = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({status: error.status || 500, message: error.message || 'Internal server error' });
        }
    }
}