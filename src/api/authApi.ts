import axiosInstance from "./axiosInstance";

const authApi = {
    login: async (email: string, password: string) => {
        const response = await axiosInstance.post("/api/login/user", { email, password });
        return response;
    }
};

export default authApi;