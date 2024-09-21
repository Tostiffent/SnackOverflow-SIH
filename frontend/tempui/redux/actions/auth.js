import { AUTH } from "../const/actionsTypes";
import * as api from "../../api/index";

export const loadUser = () => async (dispath) => {
  const localUser = JSON.parse(localStorage.getItem("user_info"));

  if (localUser) {
    dispath({ type: AUTH, data: localUser });
  }
};

export const signin = (data2, router) => async (dispath) => {
  console.log(data2);
  const { data } = await api.signIn({
    email: data2.email,
    password: data2.password,
  });
  console.log(data);
  dispath({ type: AUTH, data });
  router.push("/");
};

export const signinGoogle = (accessToken, router) => async (dispatch) => {
  try {
    // login user
    const { data } = await api.signInGoogle(accessToken);

    dispatch({ type: AUTH, data });
    router.push("/");
  } catch (err) {
    console.log(err);
  }
};

export const signup = (formData, router) => async (dispatch) => {
  try {
    // signup user
    console.log(formData);
    const { data } = await api.signUp(formData);

    dispatch({ type: AUTH, data });
    router.push("/");
  } catch (err) {
    console.log(err);
  }
};

export const signupGoogle = (accessToken, router) => async (dispatch) => {
  try {
    // signup user

    const { data } = await api.signUpGoogle(accessToken);

    dispatch({ type: AUTH, data });
    router.push("/");
  } catch (err) {
    console.log(err);
  }
};
