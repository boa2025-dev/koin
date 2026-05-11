import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function IcosahedronMesh({ mouse }) {
  const meshRef = useRef()
  const particlesRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.12 + mouse.current.y * 0.3
      meshRef.current.rotation.y = t * 0.18 + mouse.current.x * 0.3
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.05
      particlesRef.current.rotation.x = t * 0.03
    }
  })

  const particlePositions = useMemo(() => {
    const count = 180
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count)
      const theta = Math.sqrt(count * Math.PI) * phi
      const radius = 2.2 + Math.random() * 0.8
      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    return positions
  }, [])

  return (
    <group>
      {/* Wireframe icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshBasicMaterial
          color="#7C6EFF"
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial
          color="#7C6EFF"
          transparent
          opacity={0.04}
        />
      </mesh>

      {/* Orbiting particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#2FFFA0"
          size={0.035}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

export default function HeroScene() {
  const mouse = useRef({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    mouse.current = {
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: -(e.clientY / window.innerHeight - 0.5) * 2,
    }
  }

  return (
    <div
      className="w-full h-full"
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} color="#7C6EFF" intensity={1.5} />
        <pointLight position={[-5, -5, -5]} color="#2FFFA0" intensity={0.8} />
        <IcosahedronMesh mouse={mouse} />
      </Canvas>
    </div>
  )
}
