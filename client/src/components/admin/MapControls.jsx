import React from 'react';
import { LayersIcon, ExpandIcon, SatelliteIcon } from './Icons';

const MapControls = ({ activeMapLayer, onSetMapLayer, onZoomToFit }) => (
  <div className="absolute top-4 right-16 z-10 bg-white rounded-lg shadow-lg p-2 flex flex-col space-y-2">
    <button
      onClick={() => onSetMapLayer('streets')}
      className={`p-2 rounded-md hover:bg-gray-100 ${activeMapLayer === 'streets' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
      title="Streets View"
    >
      <LayersIcon className="w-5 h-5" />
    </button>
    <button
      onClick={() => onSetMapLayer('hybrid')}
      className={`p-2 rounded-md hover:bg-gray-100 ${activeMapLayer === 'hybrid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
      title="Hybrid View"
    >
      <SatelliteIcon className="w-5 h-5" />
    </button>
    <button
      onClick={onZoomToFit}
      className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
      title="Zoom to Fit All Devices"
    >
      <ExpandIcon className="w-5 h-5" />
    </button>
  </div>
);

export default MapControls;