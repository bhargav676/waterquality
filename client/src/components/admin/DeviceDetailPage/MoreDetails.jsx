import React from 'react';
import Navbar from './Dnavbar';

const MoreDetails = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 mt-20">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">More Details</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-700">Placeholder for additional parameters and features.</p>
          <p className="text-gray-700 mt-2">
            New parameters to implement: Conductivity, Temperature, ORP, Dissolved Oxygen, Salinity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MoreDetails;