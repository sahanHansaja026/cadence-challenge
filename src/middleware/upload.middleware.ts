import multer from "multer";

export const uploadCsv =
    multer({
        storage: multer.memoryStorage(),

        limits: {
            fileSize: 10 * 1024 * 1024,
        },

        fileFilter: (
            _req,
            file,
            callback,
        ) => {

            if (
                file.mimetype === "text/csv" ||
                file.originalname
                    .toLowerCase()
                    .endsWith(".csv")
            ) {
                callback(null, true);
                return;
            }

            callback(
                new Error(
                    "Only CSV files are allowed.",
                ),
            );
        },
    });