import { useMemo, useState } from 'react';
import CitySearch from './components/CitySearch/CitySearch';
import SpiralScene from './components/SpiralScene/SpiralScene';
import type { ViewPreset } from './components/SpiralScene/CameraRig';
import PlaybackControls from './components/Controls/PlaybackControls';
import Hud from './components/Hud/Hud';
import { useClimateData } from './hooks/useClimateData';
import { usePlayback } from './hooks/usePlayback';
import { buildSpiralPoints } from './utils/spiralGeometry';
import type { CityResult } from './types/climate';
import './App.scss';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function App() {
  const { dataset, loading, error, loadCity } = useClimateData();
  const [view, setView] = useState<ViewPreset>('orbit');

  const spiralPoints = useMemo(
    () => (dataset ? buildSpiralPoints(dataset.points) : []),
    [dataset]
  );

  const { currentIndex, playing, speed, setSpeed, toggle, scrubTo } = usePlayback(
    spiralPoints.length
  );

  const handleSelectCity = (city: CityResult) => {
    void loadCity(city);
    setView('orbit');
  };

  const currentPoint = dataset?.points[currentIndex];
  const currentLabel = currentPoint
    ? `${MONTH_NAMES[currentPoint.month - 1]} ${currentPoint.year}`
    : '';

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <p className="title">Climate Spiral</p>
          <p className="subtitle">
            temperature anomaly &middot; monthly &middot; ERA5 reanalysis &middot;{' '}
            <a
              href="https://svs.gsfc.nasa.gov/5190/"
              target="_blank"
              rel="noopener noreferrer"
              className="nasaLink"
            >
              inspired by NASA SVS
            </a>
          </p>
        </div>
        <CitySearch onSelect={handleSelectCity} />
      </header>

      <div className="stage">
        {dataset && spiralPoints.length > 0 && (
          <SpiralScene points={spiralPoints} currentIndex={currentIndex} view={view} />
        )}

        {!dataset && !loading && !error && (
          <div className="centerState">
            <p className="centerTitle">Search a city to trace its warming spiral</p>
            <p className="centerBody">
              Yearly temperature weather cycles for a city over 70+ years of data.
            </p>
          </div>
        )}

        {loading && (
          <div className="centerState">
            <div className="spinner" />
            <p className="centerBody">Fetching historical temperature records&hellip;</p>
          </div>
        )}

        {error && (
          <div className="centerState">
            <p className="errorText">{error}</p>
          </div>
        )}
      </div>

      {dataset && (
        <>
          <Hud city={dataset.city} point={currentPoint} />
          <div className="dockWrap">
            <PlaybackControls
              playing={playing}
              onToggle={toggle}
              currentIndex={currentIndex}
              totalFrames={spiralPoints.length}
              onScrub={scrubTo}
              speed={speed}
              onSpeedChange={setSpeed}
              view={view}
              onViewChange={setView}
              currentLabel={currentLabel}
            />
          </div>
        </>
      )}
    </div>
  );
}
