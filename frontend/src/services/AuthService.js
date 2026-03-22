import axios from "axios";

export const ACCESS_TOKEN_UPDATED = "access-token-updated";

class AuthService {
  url = import.meta.env.VITE_API_URL;
  configMultipartData = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };
  configJsonData = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  constructor() {
    this.axiosInstance = axios.create();
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const newAccessToken = localStorage.getItem("accessToken");
            originalRequest.headers["Authorization"] =
              "Bearer " + newAccessToken;
            return this.axiosInstance(originalRequest);
          } catch (e) {
            this.logoutUser();
            window.location.href = "/login";
            return Promise.reject(e);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async refreshToken() {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const authorizationHeader = {
      headers: {
        Authorization: "Bearer " + storedRefreshToken,
      },
    };

    const response = await axios.get(
      this.url + "refresh-token",
      authorizationHeader
    );

    const { accessToken, refreshToken } = response.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    window.dispatchEvent(new Event(ACCESS_TOKEN_UPDATED));
  }

  register(formData) {
    return axios.post(
      this.url + "register",
      formData,
      this.configMultipartData
    );
  }

  login(credentials) {
    return axios.post(
      this.url + "login",
      credentials,
      this.configJsonData
    );
  }

  loginUser(data) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("tokenType", data.tokenType);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  logoutUser() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("user");
  }

  isLoggedIn() {
    return (
      localStorage.getItem("isLoggedIn") === "true" &&
      !!localStorage.getItem("accessToken")
    );
  }

  getUserData() {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  forgotPassword(payload) {
    return axios.post(
      this.url + "forgot-password",
      payload,
      this.configJsonData
    );
  }

  updateUserData(formData) {
    const token = localStorage.getItem("accessToken");
    const authorizationHeader = {
      headers: {
        Authorization: token ? "Bearer " + token : "",
      },
    };

    return this.axiosInstance.post(
      this.url + "update-profile",
      formData,
      authorizationHeader
    );
  }

  setUserData(userData) {
    localStorage.setItem("user", JSON.stringify(userData));
  }

  getAllUsers() {
    const token = localStorage.getItem("accessToken");
    const authorizationHeader = {
      headers: {
        Authorization: token ? "Bearer " + token : "",
      },
    };
    return this.axiosInstance.get(this.url + "all-users", authorizationHeader);
  }

  verifyEmail(token) {
    return axios.get(
      `${this.url}verify-email?token=${encodeURIComponent(token)}`
    );
  }

  validateResetToken(token) {
    return axios.get(
      `${this.url}reset-password/validate?token=${encodeURIComponent(token)}`
    );
  }

  submitPasswordReset(payload) {
    return axios.post(
      this.url + "reset-password",
      payload,
      this.configJsonData
    );
  }
}

export default new AuthService();
