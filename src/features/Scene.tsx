import Grainient from "@/components/Grainient";

import { SceneBoards } from "./scene/SceneBoards";

export const Scene = () => {
  return (
    <div className="grid w-svw">
      <div className="col-span-full row-span-full">
        <Grainient
          color1="#7a8b19"
          color2="#38a10c"
          color3="#000000"
          timeSpeed={1}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>
      {/* <SceneBoards className="col-span-full row-span-full aspect-video" /> */}
    </div>
  );
};
