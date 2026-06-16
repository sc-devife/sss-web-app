import axiosInstance from "./axiosInstance";

const escapePointsApi = {
    getEscapePoints: async () => {
        const response = await axiosInstance.get("/library/escapepoints/all");
        return response;
    },

    createEscapePoint: async (data: any) => {
        const response = await axiosInstance.post("/library/escapepoints/create", data);
        return response;
    },
};

export default escapePointsApi;