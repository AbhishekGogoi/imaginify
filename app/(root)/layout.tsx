//this is the file where all of the pages within the application will be

import MobileNav from "@/components/shared/MobileNav";
import Sidebar from "@/components/shared/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import React from "react";

//give children as props and define the type of children as React.Reactnode
//layouts always have to export some children within them.
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="root">
      {/* Sidebar */}
      <Sidebar />
      {/* MobileNav */}
      <MobileNav />

      <div className="root-container">
        <div className="wrapper">{children}</div>
      </div>

      <Toaster />
    </main>
  );
};

export default Layout;
