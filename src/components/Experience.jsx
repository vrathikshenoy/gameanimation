'use client';
import {
  Center,
  Float,
  MeshTransmissionMaterial,
  OrbitControls,
  SoftShadows,
  Text3D,
  useVideoTexture,
} from "@react-three/drei";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  GodRays,
} from "@react-three/postprocessing";
import { useAtom } from "jotai";
import { useControls } from "leva";
import { useEffect, useState, useRef } from "react";
import { DoubleSide, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { themeAtom, THEMES } from "./UI";
import { motion, AnimatePresence } from "framer-motion";

const BackgroundVideo = ({ theme }) => {
  const videoUrls = {
    underwater: "/valo.mp4",
    space: "/pubg.mp4",
  };

  const texture = useVideoTexture(videoUrls[theme]);
  const meshRef = useRef();

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.set(-0.2, 0, 0);
      meshRef.current.position.set(0, 0, -1);

      const isMobile = window.innerWidth <= 768;
      meshRef.current.scale.set(isMobile ? 10 : 5, isMobile ? 10 : 5, 5);
    }
  }, [meshRef.current]);

  return (
    <motion.mesh
      ref={meshRef}
      receiveShadow
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <planeGeometry args={[2, 1]} />
      <meshStandardMaterial map={texture} toneMapped={false} />
    </motion.mesh>
  );
};

export const Experience = () => {
  const [theme] = useAtom(themeAtom);

  const boundaries = useControls("Boundaries", {
    debug: false,
    x: { value: 12, min: 0, max: 40 },
    y: { value: 8, min: 0, max: 40 },
    z: { value: 20, min: 0, max: 40 },
  }, { collapsed: true });

  const { focusRange, focusDistance, focalLength, bokehScale } = useControls(
    "Depth of field", {
    focusRange: { value: 3.5, min: 0, max: 20, step: 0.01 },
    focusDistance: { value: 0.25, min: 0, max: 1, step: 0.01 },
    focalLength: { value: 0.22, min: 0, max: 1, step: 0.01 },
    bokehScale: { value: 5.5, min: 0, max: 10, step: 0.1 },
  }, { collapsed: true }
  );

  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);

  const scaleX = Math.max(0.5, size[0] / 1920);
  const scaleY = Math.max(0.5, size[1] / 1080);
  const isMobile = size[0] <= 768;

  const responsiveBoundaries = {
    x: boundaries.x * scaleX,
    y: boundaries.y * scaleY,
    z: boundaries.z,
  };

  useEffect(() => {
    let timeout;
    const updateSize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setSize([window.innerWidth, window.innerHeight]);
      }, 50);
    };
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const [sunRef, setSunRef] = useState();

  const textColors = {
    underwater: "#00FFFF",
    space: "#FFD700",
  };

  const orbitControlsRef = useRef();

  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target = new Vector3(0, 0, 0);
    }
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        <BackgroundVideo key={theme} theme={theme} />
      </AnimatePresence>

      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />

      <mesh visible={boundaries.debug}>
        <boxGeometry args={[responsiveBoundaries.x, responsiveBoundaries.y, responsiveBoundaries.z]} />
        <meshStandardMaterial color="orange" transparent opacity={0.5} side={DoubleSide} />
      </mesh>

      <mesh position-y={-responsiveBoundaries.y / 2} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={THEMES[theme].groundColor} />
      </mesh>

      <SoftShadows size={15} focus={1.5} samples={12} />
      <hemisphereLight intensity={1.35} color={THEMES[theme].skyColor} groundColor={THEMES[theme].groundColor} />
      <directionalLight
        position={[0, 0, 5]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={10}
        shadow-camera-near={0.1}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      <mesh ref={(ref) => setSunRef(ref)} position-y={responsiveBoundaries.y / 4} position-z={-10} rotation-x={degToRad(70)}>
        <circleGeometry args={[12, 64]} />
        <meshBasicMaterial depthWrite={false} color={THEMES[theme].sunColor} transparent opacity={1} />
      </mesh>

      <AnimatePresence mode="wait">
        <motion.group
          key={theme + scaleX}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
        >
          <Float position-y={0.1 * scaleX} floatIntensity={2 * scaleX} rotationIntensity={2}>
            <Center>
              <Text3D
                position={[0.05 * scaleX, -0.05 * scaleY, -0.1]}
                bevelEnabled
                font="/fonts/Poppins Black_Regular.json"
                smooth={1}
                scale={(isMobile ? 0.004 : 0.008) * scaleX}
                size={80}
                height={4}
                curveSegments={10}
                bevelThickness={20}
                bevelSize={2}
                bevelOffset={0}
                bevelSegments={5}
              >
                {THEMES[theme].title}
                <meshStandardMaterial color="#ffffff" />
              </Text3D>

              <Text3D
                castShadow
                bevelEnabled
                font="/fonts/Poppins Black_Regular.json"
                smooth={1}
                scale={(isMobile ? 0.004 : 0.008) * scaleX}
                size={80}
                height={4}
                curveSegments={10}
                bevelThickness={20}
                bevelSize={2}
                bevelOffset={0}
                bevelSegments={5}
              >
                {THEMES[theme].title}
                <MeshTransmissionMaterial
                  clearcoat={1}
                  samples={3}
                  thickness={40}
                  chromaticAberration={0.25}
                  anisotropy={0.4}
                  color={textColors[theme]}
                />
              </Text3D>
            </Center>
          </Float>
        </motion.group>
      </AnimatePresence>

      <EffectComposer>
        {THEMES[theme].dof && (
          <DepthOfField
            target={[0, 0, 0]}
            worldFocusRange={focusRange}
            worldFocusDistance={focusDistance}
            focalLength={focalLength}
            bokehScale={bokehScale}
          />
        )}
        {sunRef && <GodRays sun={sunRef} exposure={0.34} decay={0.89} blur />}
        <Bloom luminanceThreshold={1.5} intensity={0.4} mipmapBlur />
      </EffectComposer>
    </>
  );
};
