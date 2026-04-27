import { Canvas } from '@react-three/fiber';
import Creature3D from './Creature3D';

export default function StarterPreview({ speciesId }: { speciesId: string }) {
  return (
    <Canvas camera={{ position: [0, 1.5, 3.2], fov: 45 }} gl={{ antialias: true }}>
      <color attach="background" args={['#1a2440']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <pointLight position={[-3, 2, -3]} intensity={0.6} color="#ffd83d" />
      <Creature3D speciesId={speciesId} position={[0, 0.4, 0]} scale={1.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <circleGeometry args={[1.4, 24]} />
        <meshStandardMaterial color="#2a3055" />
      </mesh>
    </Canvas>
  );
}
