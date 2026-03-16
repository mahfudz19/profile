"use client";

import { Environment, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from "react";
import * as THREE from 'three';

function MyAvatar({ isHovered }: { isHovered: boolean }) {
  const { scene } = useGLTF('/my-avatar.glb'); 
  const headBoneRef = useRef<THREE.Object3D<THREE.Object3DEventMap> | null>(null);
  const initialRotation = useRef<THREE.Euler | null>(null);
  const globalMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const bone = scene.getObjectByName('Bone001'); 
    if (bone) {
      headBoneRef.current = bone;
      initialRotation.current = bone.rotation.clone(); 
    }

    const handleMouseMove = (event: MouseEvent) => {
      globalMouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      globalMouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [scene]);

  useFrame(() => { 
    if (headBoneRef.current && initialRotation.current) {
      // 3. Gunakan globalMouse BUKAN state.pointer
      const targetX = isHovered ? 1 : globalMouse.current.x + 0.1; 
      const targetY = isHovered ? 0.2 : globalMouse.current.y - 0.2; 

      // MENGATUR KIRI-KANAN (Menoleh)
      headBoneRef.current.rotation.y = THREE.MathUtils.lerp(
        headBoneRef.current.rotation.y, 
        initialRotation.current.y + (targetX * 0.3), 
        0.08 
      );

      // MENGATUR ATAS-BAWAH (Menunduk/Mendongak)
      headBoneRef.current.rotation.z = THREE.MathUtils.lerp(
        headBoneRef.current.rotation.z, 
        initialRotation.current.z + (targetY * 0.4), 
        0.08
      );

      // KUNCI KEMIRINGAN (Roll)
      headBoneRef.current.rotation.x = initialRotation.current.x; 
    }
  });

  return (
    <primitive 
      object={scene} 
      scale={2} 
      position={[0, -0.1, 0]} 
      rotation={[0.1, 4.5, 0]} 
    />
  );
}

export default function Home() {
  const [isContactHovered, setIsContactHovered] = useState(false);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050914] font-sans text-slate-200 overflow-hidden">
      
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"></div>

      <main className="relative z-10 flex min-h-screen w-full max-w-7xl flex-col items-center justify-between py-16 px-8 sm:flex-row">
        
        <div className="flex flex-1 flex-col gap-6 text-center sm:text-left z-20 pointer-events-none">
          <div className="mx-auto sm:mx-0 inline-flex w-fit items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-md">
            🚀 Full-stack Developer & AI Enthusiast
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Hi, I'm <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Mahfudz
            </span>
          </h1>
          
          <p className="max-w-lg text-lg sm:text-xl leading-relaxed text-slate-400 font-light mt-2">
            Membangun aplikasi web modern, cepat, dan interaktif. Berpengalaman dalam ekosistem <strong className="text-slate-200 font-medium">React, Next.js, PHP</strong>, dan siap membawa solusi cerdas dengan teknologi Backend yang tangguh.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 mt-6 justify-center sm:justify-start pointer-events-auto">
            {/* 4. Tambahkan event listener onMouseEnter & onMouseLeave di sini */}
            <a 
              href="#" 
              onMouseEnter={() => setIsContactHovered(true)}
              onMouseLeave={() => setIsContactHovered(false)}
              className="flex h-14 items-center justify-center rounded-full bg-cyan-500 px-8 font-semibold text-[#050914] transition-all hover:scale-105 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            >
              Contact Me
            </a>
            <a 
              href="#" 
              className="flex h-14 items-center justify-center rounded-full border border-slate-700 bg-slate-800/50 backdrop-blur-sm px-8 font-medium text-slate-300 transition-all hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-slate-800"
            >
              View Projects
            </a>
          </div>
        </div>

        <div className="w-full h-125 sm:h-175 flex-1 mt-12 sm:mt-0 relative z-10">
          <Canvas orthographic camera={{ position: [0, 0, 3.5], zoom: 345 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} color="#e0f2fe" />
            <directionalLight position={[-5, 5, -5]} intensity={0.8} color="#06b6d4" /> 
            <Environment preset="city" />
            
            {/* 5. Lempar state isContactHovered ke dalam MyAvatar */}
            <MyAvatar isHovered={isContactHovered} />
          </Canvas>
        </div>

      </main>
    </div>
  );
}