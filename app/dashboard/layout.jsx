import React from 'react';

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_22%,#f8fafc_100%)]">
      <main className="w-full px-0 pb-10 pt-4 sm:pt-6">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
