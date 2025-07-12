import React, { useState, useEffect } from 'react';

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default AdminProtectedRoute;