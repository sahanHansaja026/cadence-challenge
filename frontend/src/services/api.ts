import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("token");

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        /*
         * Do not force JSON Content-Type
         * when sending FormData.
         *
         * The browser/Axios will automatically
         * create:
         *
         * multipart/form-data; boundary=...
         */
        if (
            config.data instanceof FormData
        ) {
            config.headers.delete?.(
                "Content-Type",
            );
        } else {
            config.headers["Content-Type"] =
                "application/json";
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default api;