import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SensorChart = ({ title, data, options, hasData, isDarkMode }) => {
  const [chartData, setChartData] = useState(data);

  useEffect(() => {
    const updateChartData = () => {
      const isSmallScreen = window.innerWidth < 640; // Tailwind's 'sm' breakpoint is 640px
      if (isSmallScreen && hasData && data.labels.length > 5) {
        // Reduce to 5 points for small screens
        const step = Math.floor(data.labels.length / 5);
        const reducedLabels = data.labels.filter((_, index) => index % step === 0).slice(0, 5);
        const reducedDatasets = data.datasets.map(dataset => ({
          ...dataset,
          data: dataset.data.filter((_, index) => index % step === 0).slice(0, 5),
        }));

        setChartData({
          labels: reducedLabels,
          datasets: reducedDatasets,
        });
      } else {
        // Use full data for larger screens
        setChartData(data);
      }
    };

    updateChartData();
    window.addEventListener('resize', updateChartData);
    return () => window.removeEventListener('resize', updateChartData);
  }, [data, hasData]);

  return (
    <div className={`p-5 sm:p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-gray-800">{title}</h3>
      {hasData ? (
        <div className="h-72">
          <Line data={chartData} options={options} />
        </div>
      ) : (
        <div className={`h-72 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
          <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Not enough data to display chart.</p>
        </div>
      )}
    </div>
  );
};

export default SensorChart;