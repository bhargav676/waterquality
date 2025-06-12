const Header = ({ username, timestamp, formatTimestamp, isDarkMode }) => {
  return (
    <div className="mb-8 mt-10  ml-5">
      <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-gray-700' : 'text-gray-700'}`}>{username}</h1>
      <p className={`mt-2 text-base ${isDarkMode ? 'text-gray-700' : 'text-gray-700'}`}>Your water quality monitoring dashboard</p>
      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-700' : 'text-gray-700'}`}>Last updated: {formatTimestamp(timestamp)}</p>
    </div>
  );
};

export default Header;