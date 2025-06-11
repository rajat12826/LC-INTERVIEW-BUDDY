"use client";
import React, { useEffect, useState } from 'react'

import { DarkModeSwitch } from 'react-toggle-dark-mode';

const ToggleButton = () => {
    const [toggle,setToggle]=useState(() => {
  
        return localStorage.getItem("theme") === "dark" ? true : false;
      });
      
      useEffect(()=>{
        if(toggle){
          document.documentElement.classList.add("dark")
          localStorage.setItem("theme", "dark");
        }
        else{
          document.documentElement.classList.remove("dark")
          localStorage.setItem("theme", "light");
        }
      },[toggle])
    return (
        <DarkModeSwitch
            checked={toggle}
            onChange={setToggle}
            size={24}
           
        />
    );
};

export default ToggleButton;