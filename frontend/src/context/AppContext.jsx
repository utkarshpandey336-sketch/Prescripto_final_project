import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const currencySymbol = '$';
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(
    localStorage.getItem('token') ? localStorage.getItem('token') : ''
  );
  const [userData, setUserData] = useState(false);


  // logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUserData(false);
  };


  // fetch the real, live doctor list from backend
  const getDoctorsData = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + '/api/doctor/list'
      );

      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };


  // fetch logged-in user's profile
  const loadUserProfileData = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + '/api/user/profile',
        {
          headers: { token }
        }
      );

      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.log(error);

      if (
        error.response?.data?.message === "Invalid or expired token"
      ) {
        logout();
        toast.error("Session expired. Please login again.");
      } 
      else {
        toast.error(error.response?.data?.message || error.message);
      }
    }
  };


  useEffect(() => {
    getDoctorsData();
  }, []);


  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      loadUserProfileData();
    } 
    else {
      localStorage.removeItem('token');
      setUserData(false);
    }

  }, [token]);


  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData,
    logout,
  };


  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;