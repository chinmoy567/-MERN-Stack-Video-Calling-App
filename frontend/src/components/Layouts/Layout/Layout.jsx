import React from "react";

import Navbar from "../NaVbar/Navbar";

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <div>
        {children}
      </div>
    </>
  );
};

export default Layout;
