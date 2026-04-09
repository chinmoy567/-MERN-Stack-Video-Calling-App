import axios from "axios";

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

  // Axios instance with interceptors
  constructor() {
    this._refreshPromise = null;

    this.axiosInstance = axios.create({ timeout: 10000 });
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (!error.response || error.response.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        // Prevent parallel refresh calls — reuse in-flight promise
        if (!this._refreshPromise) {
          this._refreshPromise = this.refreshToken().finally(() => {
            this._refreshPromise = null;
          });
        }

        try {
          await this._refreshPromise;
          const newAccessToken = localStorage.getItem("accessToken");
          originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
          return this.axiosInstance(originalRequest);
        } catch (e) {
          // refresh token also expired
          this.logoutUser();
          window.location.href = "/login";
          return Promise.reject(e);
        }
      }
    );
  }

  // Refresh token method
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
  }

  // Register method
  register(formData) {
    return axios.post(
      this.url + "register",
      formData,
      this.configMultipartData
    );
  }

  // Login method
  login(formData) {
    return axios.post(this.url + "login", formData, this.configJsonData);
  }

  // Store user data in local storage after login
  loginUser(data) {
    localStorage.setItem("isLoggedIn", true);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("tokenType", data.tokenType);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  // Logout method
  logoutUser() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("user");
  }
  // Check if user is logged in
  isLoggedIn() {
    return localStorage.getItem("isLoggedIn") === "true";
  }

  // Get user data from local storage
  getUserData() {
    return JSON.parse(localStorage.getItem("user"));
  }

  //forget password
  forgotPassword(formData) {
    return axios.post(  
      this.url + "forgot-password",
      formData,
      this.configJsonData
    );
  }

  // Update user data
  updateUserData(formData) {
    const authorizationHeader = {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("accessToken"),
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
  const authorizationHeader = {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
    }
  };
  return this.axiosInstance.get(this.url + 'all-users', authorizationHeader);
}

}
export default new AuthService();
