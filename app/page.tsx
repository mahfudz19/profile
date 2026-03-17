"use client";

import { useEffect, useRef, useState, Suspense } from "react";
// Perhatikan: Kita mengganti Scroll dengan Html
import { useGLTF, Environment, Sparkles, Float, ScrollControls, useScroll, Text, Html, useTexture, Decal } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ==========================================
// 1. SKENARIO SUTRADARA (ARRAY WAYPOINTS)
// ==========================================
const avatarWaypoints = [
  {
    // SCENE 1: HERO
    position: [1.5, -0.3, 0],
    rotation: [0, -2, 0],
    scale: 2.8
  },
  {
    // SCENE 2: SKILLS (Kamera Zoom Out)
    position: [-1.8, -0.2, -1], // Menambahkan sumbu Z (-1) agar avatar makin mundur
    rotation: [0, -1, 0.1],
    scale: 1.8 // Scale diturunkan drastis dari 2.8 ke 1.8 untuk efek Zoom Out!
  }
];

// ==========================================
// 2. KOMPONEN AVATAR
// ==========================================
function MyAvatar({ isHovered }: { isHovered: boolean }) {
  const { scene } = useGLTF('/my-avatar.glb'); 
  const headBoneRef = useRef<THREE.Object3D<THREE.Object3DEventMap> | null>(null);
  const initialRotation = useRef<THREE.Euler | null>(null);
  const globalMouse = useRef({ x: 0, y: 0 });
  
  const scroll = useScroll();
  const avatarGroup = useRef<THREE.Group>(null);

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
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [scene]);

  useFrame(() => { 
    if (headBoneRef.current && initialRotation.current) {
      const targetX = isHovered ? 1 : globalMouse.current.x + 0.1; 
      const targetY = isHovered ? -0.3 : globalMouse.current.y - 0.2; 

      headBoneRef.current.rotation.y = THREE.MathUtils.lerp(
        headBoneRef.current.rotation.y, initialRotation.current.y + (targetX * 0.3), 0.08 
      );
      headBoneRef.current.rotation.z = THREE.MathUtils.lerp(
        headBoneRef.current.rotation.z, initialRotation.current.z + (targetY * 0.4), 0.08
      );
      headBoneRef.current.rotation.x = initialRotation.current.x; 
    }

    if (avatarGroup.current) {
      const offset = scroll.offset; 
      const safeOffset = Math.max(0, Math.min(1, offset)); 
      
      const totalScenes = avatarWaypoints.length - 1; 
      const scaledOffset = safeOffset * totalScenes; 
      
      const currentScene = Math.floor(scaledOffset); 
      const nextScene = Math.min(currentScene + 1, totalScenes); 
      const localOffset = scaledOffset - currentScene;

      const start = avatarWaypoints[currentScene];
      const end = avatarWaypoints[nextScene];

      avatarGroup.current.position.x = THREE.MathUtils.lerp(start.position[0], end.position[0], localOffset);
      avatarGroup.current.position.y = THREE.MathUtils.lerp(start.position[1], end.position[1], localOffset);
      avatarGroup.current.position.z = THREE.MathUtils.lerp(start.position[2], end.position[2], localOffset);

      avatarGroup.current.rotation.x = THREE.MathUtils.lerp(start.rotation[0], end.rotation[0], localOffset);
      avatarGroup.current.rotation.y = THREE.MathUtils.lerp(start.rotation[1], end.rotation[1], localOffset);
      avatarGroup.current.rotation.z = THREE.MathUtils.lerp(start.rotation[2], end.rotation[2], localOffset);

      const currentScale = THREE.MathUtils.lerp(start.scale, end.scale, localOffset);
      avatarGroup.current.scale.set(currentScale, currentScale, currentScale);
    }
  });

  return (
    <group ref={avatarGroup}>
      <primitive object={scene} />
    </group>
  );
}

// ==========================================
// 3. KOMPONEN BALOK KACA
// ==========================================
function GlassCube({ position, text, color }: { position: [number, number, number], text: string, color: string }) {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2} position={position}>
      <mesh>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshPhysicalMaterial
          transmission={1} 
          opacity={1}
          roughness={0.25} 
          ior={1.5} 
          thickness={1.5} 
          color={color} 
          transparent
        />
      </mesh>
      <Text position={[0, 0, 0.65]} fontSize={0.28} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
        {text}
      </Text>
    </Float>
  );
}

// Pastikan Anda sudah mengimpor useTexture dan Decal di baris atas file Anda!
// import { useGLTF, Environment, Sparkles, Float, ScrollControls, useScroll, Html, useTexture, Decal } from '@react-three/drei';

// ==========================================
// 3. KOMPONEN BALOK KACA BERLOGO (LOGO CUBE)
// ==========================================
function LogoCube({ position, imgPath, color }: { position: [number, number, number], imgPath: string, color: string }) {
  // Memuat gambar dari folder public
  const texture = useTexture(imgPath);

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2} position={position}>
      <mesh>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshPhysicalMaterial
          transmission={1} 
          opacity={1}
          roughness={0.25} 
          ior={1.5} 
          thickness={1.5} 
          color={color} 
          transparent
        />
        {/* Ini adalah "Stiker" logo yang ditempel di sisi depan kaca (Z = 0.6) */}
        <Decal position={[0, 0, 0.6]} rotation={[0, 0, 0]} scale={0.8}>
          <meshBasicMaterial 
            map={texture} 
            transparent 
            polygonOffset 
            polygonOffsetFactor={-1} 
          />
        </Decal>
      </mesh>
    </Float>
  );
}

function SkillCubes() {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const offset = scroll.offset;
    if (groupRef.current) {
      groupRef.current.position.z = THREE.MathUtils.lerp(8, -2, offset);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(0, -Math.PI * 0.2, offset);
    }
  });

  return (
    <group ref={groupRef} position={[2.5, 0, -2]}>
      {/* Panggil LogoCube dan arahkan imgPath ke gambar di folder public Anda */}
      <LogoCube position={[-0.5, 1.5, 0]} imgPath="/react.svg" color="#a5f3fc" />
      <LogoCube position={[1.2, 0.5, 0.5]} imgPath="/next.svg" color="#f8fafc" />
      <LogoCube position={[-1, -0.5, -0.5]} imgPath="/php.png" color="#c7d2fe" />
      <LogoCube position={[0.8, -1.5, 1]} imgPath="/mysql.png" color="#fde047" />
      <LogoCube position={[-0.2, -2.5, 0]} imgPath="/mongo.png" color="#bbf7d0" />
    </group>
  );
}

// ==========================================
// 4. OVERLAY HTML SINEMATIK (Diperbaiki)
// ==========================================
function CinematicHtmlOverlay({ isContactHovered, setIsContactHovered }: any) {
  const scroll = useScroll();
  const heroRef = useRef<HTMLElement>(null);
  const skillsRef = useRef<HTMLElement>(null);

  useFrame(() => {
    const offset = scroll.offset;
    
    // Animasi Scene 1
    if (heroRef.current) {
      const opacity = Math.max(0, 1 - offset * 3);
      heroRef.current.style.opacity = opacity.toString();
      heroRef.current.style.transform = `scale(${1 - offset * 0.5})`;
      heroRef.current.style.pointerEvents = offset > 0.1 ? 'none' : 'auto';
      // Sembunyikan sepenuhnya dari layar jika tidak terlihat
      heroRef.current.style.visibility = opacity === 0 ? 'hidden' : 'visible';
    }

    // Animasi Scene 2 (Dibuat lebih cepat muncul dan lebih mulus)
    if (skillsRef.current) {
      const opacity = Math.min(1, Math.max(0, (offset - 0.35) * 2.5));
      skillsRef.current.style.opacity = opacity.toString();
      skillsRef.current.style.transform = `scale(${0.9 + offset * 0.1})`;
      skillsRef.current.style.pointerEvents = offset > 0.6 ? 'auto' : 'none';
      // Tampilkan hanya jika mulai terlihat
      skillsRef.current.style.visibility = opacity > 0 ? 'visible' : 'hidden';
    }
  });

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="relative w-screen h-screen overflow-hidden text-slate-200">
        
        {/* --- TEKS SCENE 1: HERO --- */}
        <section ref={heroRef} className="absolute inset-0 flex flex-col justify-center max-w-7xl mx-auto px-8 w-full transition-transform duration-75">
          <div className="flex flex-col gap-6 text-center sm:text-left max-w-2xl">
            <div className="mx-auto sm:mx-0 inline-flex w-fit items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-md">
              🚀 Full-stack Developer & AI Enthusiast
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Hi, I'm <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                Mahfudz
              </span>
            </h1>
            <p className="max-w-lg text-lg sm:text-xl leading-relaxed text-slate-300 font-light mt-2 drop-shadow-md">
              Membangun aplikasi web modern, cepat, dan interaktif. Berpengalaman dalam ekosistem <strong className="text-white font-medium">React, Next.js, PHP</strong>, dan siap membawa solusi cerdas dengan teknologi Backend yang tangguh.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 mt-6 justify-center sm:justify-start pointer-events-auto">
              <a href="#" onMouseEnter={() => setIsContactHovered(true)} onMouseLeave={() => setIsContactHovered(false)} className="flex h-14 items-center justify-center rounded-full bg-cyan-500 px-8 font-semibold text-[#050914] transition-all hover:scale-105 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                Contact Me
              </a>
              <a href="#" className="flex h-14 items-center justify-center rounded-full border border-cyan-500/50 bg-slate-900/50 backdrop-blur-md px-8 font-medium text-cyan-300 transition-all hover:border-cyan-400 hover:bg-cyan-900/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                View Projects
              </a>
            </div>
          </div>
        </section>

        {/* --- TEKS SCENE 2: SKILLS --- */}
        {/* PERBAIKAN: Memakai opacity-0 Tailwind murni */}
        <section ref={skillsRef} className="opacity-0 absolute inset-0 flex flex-col justify-center max-w-7xl mx-auto px-8 w-full transition-transform duration-75">
          <div className="flex flex-col gap-6 text-center sm:text-right max-w-2xl ml-auto mt-20 pointer-events-auto">
            <h2 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-xl z-10">
              The <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Core</span> Engine
            </h2>
            
            {/* PERBAIKAN DESAIN: Diberi background kaca gelap agar teks tidak bertabrakan dengan balok 3D */}
            <div className="bg-[#050914]/40 p-6 rounded-2xl backdrop-blur-sm border border-slate-800/50 shadow-2xl z-10">
              <p className="text-xl leading-relaxed text-slate-300 font-light drop-shadow-md">
                Tidak hanya mahir merakit antarmuka yang memukau dengan <strong className="text-white font-medium">React & Next.js</strong>, saya juga merancang arsitektur data yang kokoh di balik layar menggunakan <strong className="text-white font-medium">PHP, MySQL, dan Mongo</strong>.
              </p>
            </div>
          </div>
        </section>

      </div>
    </Html>
  );
}

// ==========================================
// 5. KOMPONEN UTAMA (HOME)
// ==========================================
export default function Home() {
  const [isContactHovered, setIsContactHovered] = useState(false);

  return (
    <div className="relative w-full h-screen bg-[#050914] font-sans text-slate-200">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 right-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none z-0"></div>

      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          
          {/* BUNGKUS DENGAN SUSPENSE AGAR MENUNGGU GAMBAR & MODEL 3D SELESAI DIMUAT */}
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} color="#0f172a" />
            <directionalLight position={[5, 10, 5]} intensity={2} color="#06b6d4" /> 
            <directionalLight position={[-5, 5, -5]} intensity={2} color="#3b82f6" /> 
            <Environment preset="city" />
            
            <Sparkles position={[0, 0, -2]} count={150} scale={15} size={3} speed={0.4} opacity={0.6} color="#06b6d4" />

            <ScrollControls pages={2} damping={0.2}>
              {/* Teks HTML yang Sinematik */}
              <CinematicHtmlOverlay isContactHovered={isContactHovered} setIsContactHovered={setIsContactHovered} />

              {/* Objek 3D */}
              <Float speed={2} rotationIntensity={0.05} floatIntensity={0.1}>
                <MyAvatar isHovered={isContactHovered} />
              </Float>
              <SkillCubes />
            </ScrollControls>
          </Suspense>

        </Canvas>
      </div>
    </div>
  );
}