import API from "./Api";

// Register user
export const registerApi = (data) => {
  return API.post("/register", data, { noAuth: true });
};

// Login user
export const loginApi = (data) => {
  return API.post("/login", data, { noAuth: true });
};
