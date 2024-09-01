import React, { useState } from 'react';

const VolumeSlider = () => {
  const [volume, setVolume] = useState(100);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value));
  };

  return (
    <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg">
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={handleVolumeChange}
        className="w-64 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #4b5563 ${volume}%, #4b5563 100%)`,
        }}
      />
      <span className="text-white font-semibold">{volume}</span>
    </div>
  );
};

export default VolumeSlider;