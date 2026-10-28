import { GrainGradient } from '@paper-design/shaders-react';

export function RightBlock() {
  return (
    <div className="relative h-full w-full">
        <GrainGradient
        width={1280}
        height={720}
        colors={["#757575", "#9e9e9e", "#212121"]}
        colorBack="#0e0d16"
        softness={0}
        intensity={0.15}
        noise={0.5}
        shape="blob"
        speed={1}
        scale={1.3}
        />
    </div>
  );
}