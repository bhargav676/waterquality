import { FaVial, FaSmog, FaTint, FaInfoCircle, FaArrowUp, FaArrowDown, FaEquals } from 'react-icons/fa';
import AnalogMeter from './AnalogMeter';
import { useMemo } from 'react';

const SensorCard = ({ type, value, prevValue, timestamp }) => {
  const config = {
    ph: {
      icon: FaVial,
      title: 'pH Level',
      unit: '',
      range: '6.5 - 8.5',
      min: 4,
      max: 10,
      normalMin: 6.5,
      normalMax: 8.5,
      tickStep: 1,
      color: "#06b6d4",
      info: "pH measures how acidic/basic water is. Safe drinking water is typically 6.5-8.5."
    },
    turbidity: {
      icon: FaSmog,
      title: 'Turbidity',
      unit: 'NTU',
      range: '1 - 5',
      min: 0,
      max: 10,
      normalMin: 1,
      normalMax: 5,
      tickStep: 1,
      color: "#06b6d4",
      info: "Turbidity is the cloudiness of water. Lower NTU means clearer water."
    },
    tds: {
      icon: FaTint,
      title: 'Total Dissolved Solids',
      unit: 'MG/L',
      range: '500 - 2000',
      min: 0,
      max: 2500,
      normalMin: 500,
      normalMax: 2000,
      tickStep: 500,
      color: "#06b6d4",
      info: "TDS indicates total dissolved solids in water. Too high or low can affect taste and health."
    }
  };

  const {
    icon: Icon,
    title,
    unit,
    range,
    min,
    max,
    normalMin,
    normalMax,
    tickStep,
    color,
    info
  } = config[type];

  // Status logic
  const status = useMemo(() => {
    if (value < normalMin || value > normalMax) {
      return { label: "Out of Range", color: "bg-red-500", text: "text-red-600" };
    }
    if (value === normalMin || value === normalMax) {
      return { label: "Borderline", color: "bg-yellow-400", text: "text-yellow-600" };
    }
    return { label: "Normal", color: "bg-green-500", text: "text-green-600" };
  }, [value, normalMin, normalMax]);

  // Trend logic
  let TrendIcon = FaEquals;
  let trendColor = "text-slate-400";
  if (typeof prevValue === "number") {
    if (value > prevValue) {
      TrendIcon = FaArrowUp;
      trendColor = "text-orange-500";
    } else if (value < prevValue) {
      TrendIcon = FaArrowDown;
      trendColor = "text-blue-500";
    }
  }

  // Use the passed timestamp or fallback to a default
  const lastUpdated = timestamp || "Last updated: N/A";

  return (
    <div
      className="relative rounded-2xl shadow-xl p-6 flex flex-col items-center bg-white hover:shadow-2xl transition-shadow duration-300 m-0"
      style={{
        width: '320px',
        minHeight: '350px',
        background: "linear-gradient(135deg, #f0fdfa 70%, #e0f7fa 100%)",
        boxSizing: 'border-box'
      }}
    >
      {/* Watermark icon background */}
      <div className="absolute opacity-10 right-4 top-4 text-[60px] pointer-events-none z-0">
        <Icon />
      </div>
      {/* Info and status */}
      <div className="flex w-full justify-between items-center mb-3 z-10">
        <span
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${status.color} bg-opacity-80 text-white`}
        >
          <span className="w-2 h-2 rounded-full bg-white mr-1" />
          {status.label}
        </span>
        <div className="group relative flex items-center">
          <FaInfoCircle className="text-slate-400 cursor-pointer" />
          <div className="absolute z-20 left-1/2 -translate-x-1/2 top-7 w-48 rounded-md shadow-md bg-white text-xs text-slate-700 px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {info}
          </div>
        </div>
      </div>
      {/* Icon and Title */}
      <div className="flex flex-col items-center gap-2 mb-4 z-10">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-50 shadow-sm">
          <Icon className="text-2xl text-teal-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </div>
      {/* Meter */}
      <div className="flex-1 flex items-center justify-center  w-full" style={{ minHeight: '150px' }}>
        <AnalogMeter
          value={value}
          min={min}
          max={max}
          unit={unit}
          label={`Normal: ${range}`}
          dangerMin={normalMin}
          dangerMax={normalMax}
          tickStep={tickStep}
          color={color}
        />
      </div>
      {/* Min/Max Range */}
      <div className="flex w-full justify-between text-xs text-slate-400 mt-3 z-10">
        <span>Min: {min}{unit}</span>
        <span>Max: {max}{unit}</span>
      </div>
    </div>
  );
};

export default SensorCard;