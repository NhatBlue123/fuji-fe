const TOKEN_KEY = "fuji_access_token";


/**
* Lưu token
*/
export const setToken = (token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
    }
};


/**
* Lấy token
*/
export const getToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
};


/**
* Xoá token (logout)
*/
export const removeToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
    }
};