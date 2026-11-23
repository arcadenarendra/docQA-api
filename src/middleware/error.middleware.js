const errorHandler = (err, req, res, next) => {
    const statusCode = Number(err.statusCode || err.status) || 500;

    if (statusCode >= 500) {
        console.error('Server Error:', err);
    }

    res.status(statusCode).json({
        error: {
            message:
                statusCode >= 500
                    ? 'Internal server error'
                    : err.message
        }
    });
};

export default errorHandler;