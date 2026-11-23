export async function uploadDocument(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: {
                    message: 'Please upload a PDF document'
                }
            });
        }

        return res.status(201).json({
            message: 'Document uploaded successfully',
            document: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (error) {
        next(error);
    }
}