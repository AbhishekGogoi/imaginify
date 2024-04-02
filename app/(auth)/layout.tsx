import React from "react";

//give children as props and define the type of children as React.Reactnode
//layouts always have to export some children within them.
const Layout = ({ children }: { children: React.ReactNode }) => {
  return <main className="auth">{children}</main>;
};

export default Layout;
