/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { signup, signupGoogle } from "../../redux/actions/auth";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";

const InitState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const LoginPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [sForm, setsForm] = useState(InitState);

  const handleChange = (e: any) =>
    setsForm({
      ...sForm,
      [e.target.name]: e.target.value,
    });

  function handleGoogleLoginSuccess(tokenResponse: any) {
    const accessToken = tokenResponse.access_token;

    dispatch(signupGoogle(accessToken, router));
  }

  function handleOnSubmit(e: any) {
    console.log("submitting");
    e.preventDefault();
    console.log("dispatching");
    dispatch(signup(sForm, router));
  }
  const login = useGoogleLogin({ onSuccess: handleGoogleLoginSuccess });
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-stretch bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <div className="flex-1 text-white p-8 lg:p-12 flex flex-col justify-center items-center text-center">
          <h1 className="text-3xl lg:text-4xl font-semibold">
            Welcome to our service
          </h1>
          <p className="mt-4 text-gray-400">Sign Up to Continue</p>
        </div>
        <div className="flex-1 bg-white p-8 lg:p-12">
          <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900">
            Sign Up
          </h2>
          <form className="mt-6 space-y-4 lg:space-y-6">
            <div>
              <label className="block text-gray-700">First Name</label>
              <input
                name="firstName"
                onChange={handleChange}
                type="text"
                placeholder="Enter your email address"
                className="mt-1 w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-700">Last Name</label>
              <input
                name="lastName"
                onChange={handleChange}
                type="text"
                placeholder="Enter your email address"
                className="mt-1 w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-700">Email address</label>
              <input
                name="email"
                onChange={handleChange}
                type="email"
                placeholder="Enter your email address"
                className="mt-1 w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-700">Password</label>
              <input
                name="password"
                onChange={handleChange}
                type="password"
                placeholder=""
                className="mt-1 w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-700">Confirm Password</label>
              <input
                name="confirmpassword"
                onChange={handleChange}
                type="password"
                placeholder=""
                className="mt-1 w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Stay signed in
                </label>
              </div>
              <div>
                <a
                  href="#"
                  className="text-sm text-purple-600 hover:text-purple-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>
            <div>
              <button
                onClick={handleOnSubmit}
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Sign up
              </button>
            </div>
            <div className="text-center text-gray-600 mt-4">
              <p>
                Don't have an account?{" "}
                <a href="#" className="text-purple-600">
                  Sign Up
                </a>
              </p>
            </div>
            <div className="mt-4 space-y-4">
              <button
                onClick={() => login()}
                className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <img
                  src="https://img.icons8.com/color/24/000000/google-logo.png"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                Continue with Google
              </button>
              <button className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <img
                  src="https://img.icons8.com/color/24/000000/facebook-new.png"
                  alt="Facebook"
                  className="w-5 h-5 mr-2"
                />
                Continue with Facebook
              </button>
              <button className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <img
                  src="https://img.icons8.com/ios-filled/50/000000/mac-os.png"
                  alt="Apple"
                  className="w-5 h-5 mr-2"
                />
                Continue with Apple
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-4 text-center">
            By clicking Sign in, Continue with Google, Facebook, or Apple, you
            agree to Spectra's Terms of Use and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
