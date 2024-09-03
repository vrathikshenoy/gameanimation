'use client';
import {
  Center,
  Float,
  MeshTransmissionMaterial,
  OrbitControls,
  SoftShadows,
  Text3D,
  useVideoTexture,
  useFont,
  useGLTF,
  SpotLight,
  useHelper
} from "@react-three/drei";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  GodRays,
} from "@react-three/postprocessing";
import { atom, useAtom } from "jotai";
import { useControls } from "leva";
import { useEffect, useState, useRef } from "react";
import { DoubleSide, Vector3, SpotLightHelper } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { motion, AnimatePresence } from "framer-motion";
import { useFrame } from "@react-three/fiber";

// Theme configuration
export const themeAtom = atom("underwater");
export const THEMES = {
  underwater: {
    key: "underwater",
    skyColor: "#006994",
    sunColor: "#FDB813",
    groundColor: "#006994",
    title: "VALORANT",
    subtitle: "Dive into action",
    dof: true,
  },
  space: {
    key: "space",
    skyColor: "#000000",
    sunColor: "#FDB813",
    groundColor: "#1C1C1C",
    title: "BGMI",
    subtitle: "Battle beyond the stars",
    dof: false,
  },
};

// Preload fonts
Object.values(THEMES).forEach((theme) => {
  useFont.preload(`/fonts/${theme.title}_Regular.json`);
});
useFont.preload("/fonts/Poppins Black_Regular.json");

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

const DynamicSpotlight = () => {
  const spotLightRef = useRef();
  const [time, setTime] = useState(0);

  // Uncomment the next line to see the spotlight helper (for debugging)
  // useHelper(spotLightRef, SpotLightHelper, 'cyan')

  useFrame((state, delta) => {
    setTime((prevTime) => (prevTime + delta) % 10); // 10 seconds for a complete cycle

    const x = Math.sin((time / 5) * Math.PI) * 5; // 5 units left and right
    spotLightRef.current.position.x = x;

    // Adjust the target based on the light's position
    spotLightRef.current.target.position.set(x / 2, 0, 0);
    spotLightRef.current.target.updateMatrixWorld();
  });

  return (
    <SpotLight
      ref={spotLightRef}
      distance={10}
      angle={0.3}
      attenuation={5}
      anglePower={5}
      intensity={2}
      color="#ffffff"
      position={[0, 5, 5]} // Adjusted height and depth for better illumination
    />
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
              <group>
                <Text3D
                  font={`/fonts/${THEMES[theme].title}_Regular.json`}
                  position={[0, 0.5 * scaleY, 0]}
                  scale={(isMobile ? 0.004 : 0.008) * scaleX}
                  size={80}
                  height={4}
                  curveSegments={12}
                  bevelEnabled
                  bevelThickness={0.02}
                  bevelSize={0.02}
                  bevelOffset={0}
                  bevelSegments={5}
                >
                  {THEMES[theme].title}
                  <MeshTransmissionMaterial
                    backside
                    samples={4}
                    thickness={0.25}
                    chromaticAberration={0.5}
                    anisotropy={0.3}
                    distortion={0.1}
                    distortionScale={0.1}
                    temporalDistortion={0.1}
                    iridescence={1}
                    iridescenceIOR={1}
                    iridescenceThicknessRange={[0, 1400]}
                    color={THEMES[theme].skyColor}
                  />
                </Text3D>
                <Text3D
                  font="/fonts/Poppins Black_Regular.json"
                  position={[0, -0.5 * scaleY, 0]}
                  scale={(isMobile ? 0.002 : 0.004) * scaleX}
                  size={80}
                  height={2}
                  curveSegments={12}
                >
                  {THEMES[theme].subtitle}
                  <meshStandardMaterial color={THEMES[theme].sunColor} />
                </Text3D>
                <DynamicSpotlight />
              </group>
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

export const UI = () => {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <main className="pointer-events-none select-none z-10 fixed inset-0 flex justify-center items-center flex-col">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(0,0,0,0.0)_70%,rgba(0,0,0,1)_170%)]" />
      <motion.div
        className="absolute z-10 pointer-events-auto flex flex-col items-center justify-center bottom-0 w-screen p-10 gap-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.p
          className="text-white text-xl font-bold mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Choose Your Battleground
        </motion.p>
        <div className="flex gap-4 items-center justify-center">
          {Object.values(THEMES).map((t) => (
            <motion.button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={`p-4 rounded-lg border-2 transition-all duration-300 min-w-40 text-lg font-bold uppercase tracking-wider
                ${theme === t.key
                  ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white border-transparent"
                  : "bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-400"
                }`}
              whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(255,255,255,0.5)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: t.key === "underwater" ? 0.4 : 0.6 }}
            >
              {t.title}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </main>
  );
};
