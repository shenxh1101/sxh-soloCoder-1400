import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Sea = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#0a2463') },
  }), []);

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave = sin(pos.x * 0.1 + uTime) * 0.2 + cos(pos.y * 0.1 + uTime * 0.8) * 0.15;
      pos.z += wave;
      vWave = wave;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    varying vec2 vUv;
    varying float vWave;
    
    void main() {
      float depth = 0.5 + vWave * 0.5;
      vec3 color = mix(uColor, vec3(0.05, 0.15, 0.4), depth);
      gl_FragColor = vec4(color, 0.85);
    }
  `;

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -30]}>
        <planeGeometry args={[200, 100, 50, 50]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
        />
      </mesh>

      <mesh position={[0, -0.02, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 80]} />
        <meshStandardMaterial color="#475569" metalness={0.1} roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.01, -22]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[60, 0.02, 6]} />
        <meshStandardMaterial color="#334155" metalness={0.1} roughness={0.9} />
      </mesh>

      {Array.from({ length: 15 }).map((_, i) => (
        <mesh 
          key={`lamp-${i}`} 
          position={[-25 + i * 4, 6, -20]} 
          castShadow
        >
          <cylinderGeometry args={[0.1, 0.1, 12, 8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {Array.from({ length: 15 }).map((_, i) => (
        <pointLight 
          key={`light-${i}`}
          position={[-25 + i * 4, 11, -20]} 
          intensity={0.6} 
          distance={10} 
          color="#ffdd88" 
        />
      ))}

      {Array.from({ length: 20 }).map((_, i) => (
        <mesh 
          key={`container-box-${i}`} 
          position={[-30 + i * 3, 1.5, 15]} 
          castShadow
        >
          <boxGeometry args={[2.8, 2.6, 2.4]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#1e40af' : '#c2410c'} metalness={0.3} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};
