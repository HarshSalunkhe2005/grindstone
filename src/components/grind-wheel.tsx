"use client";

import { useEffect, useRef, useState } from "react";

type Three = typeof import("three");

const SPARKS = 420;
const WHEEL_R = 1.5;
const CONTACT_ANGLE = -0.62; // radians: lower right of the wheel

function gritTexture(THREE: Three, repeatX: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#3a4558";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 11000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    g.fillStyle = Math.random() > 0.5 ? `rgba(196,210,230,${Math.random() * 0.2})` : `rgba(0,0,0,${Math.random() * 0.38})`;
    g.fillRect(x, y, 1 + Math.random() * 1.6, 1 + Math.random() * 1.6);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function faceTexture(THREE: Three) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2d3646";
  g.fillRect(0, 0, 512, 512);
  for (let r = 40; r < 256; r += 7 + Math.random() * 9) {
    g.strokeStyle = `rgba(150,170,200,${0.04 + Math.random() * 0.07})`;
    g.lineWidth = 1 + Math.random();
    g.beginPath();
    g.arc(256, 256, r, 0, Math.PI * 2);
    g.stroke();
  }
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Starts the scene inside `host` and returns a cleanup function. Throws if WebGL is unavailable. */
function start(THREE: Three, host: HTMLElement, reduced: boolean): () => void {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const canvas = renderer.domElement;
  canvas.style.cssText = "width:100%;height:100%;display:block";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0.7, 0.35, 9.2);
  camera.lookAt(0.75, -0.2, 0);

  // Lighting: cool key, arc rim, and a warm point light that lives at the contact point.
  scene.add(new THREE.AmbientLight(0x7c8db0, 1.0));
  const key = new THREE.DirectionalLight(0xcfe8ff, 3.2);
  key.position.set(-3.5, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x5cc8ff, 2.2);
  rim.position.set(4, 1, -3);
  scene.add(rim);
  const glow = new THREE.PointLight(0xffb15c, 0, 5, 1.6);
  scene.add(glow);

  // The wheel: a stone cylinder on a steel hub, spinning about its own axis.
  const pivot = new THREE.Group();
  scene.add(pivot);
  const spinner = new THREE.Group();
  spinner.rotation.x = Math.PI / 2; // cylinder axis -> z
  pivot.add(spinner);

  const side = gritTexture(THREE, 7);
  const face = faceTexture(THREE);
  const stoneSide = new THREE.MeshStandardMaterial({ map: side, roughness: 0.94, metalness: 0.05 });
  const stoneFace = new THREE.MeshStandardMaterial({ map: face, roughness: 0.85, metalness: 0.1 });
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.62, 128, 1), [stoneSide, stoneFace, stoneFace]);
  spinner.add(wheel);

  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa7ba, roughness: 0.28, metalness: 0.95 });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.86, 48), steel);
  spinner.add(hub);
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.5, 24), steel);
  spinner.add(bolt);

  // The blade being sharpened, touching the wheel at the contact point.
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xc4cedd, roughness: 0.22, metalness: 1 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.07, 0.6), bladeMat);
  scene.add(blade);

  // Sparks: streaks (line segments) plus a glowing head (points).
  const pos = new Float32Array(SPARKS * 3);
  const vel = new Float32Array(SPARKS * 3);
  const life = new Float32Array(SPARKS);
  const maxLife = new Float32Array(SPARKS);
  const warm = new Uint8Array(SPARKS);
  const linePos = new Float32Array(SPARKS * 6);
  const lineCol = new Float32Array(SPARKS * 6);
  const headCol = new Float32Array(SPARKS * 3);
  const lines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  lines.geometry.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  lines.geometry.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
  lines.frustumCulled = false;
  scene.add(lines);
  const heads = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.11, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  heads.geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  heads.geometry.setAttribute("color", new THREE.BufferAttribute(headCol, 3));
  heads.frustumCulled = false;
  scene.add(heads);

  const contact = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let cursor = 0;
  let acc = 0;
  let angle = 0;
  let boost = 0;
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;

  function place() {
    pivot.rotation.set(ty * 0.1, -0.5 + tx * 0.2, 0.05);
    pivot.updateMatrixWorld(true);
    contact.set(WHEEL_R * Math.cos(CONTACT_ANGLE), WHEEL_R * Math.sin(CONTACT_ANGLE), 0.0);
    pivot.localToWorld(contact);
    // Surface velocity of a counter-clockwise wheel at the contact point.
    tangent.set(-Math.sin(CONTACT_ANGLE), Math.cos(CONTACT_ANGLE), 0).transformDirection(pivot.matrixWorld);
    blade.position.set(contact.x + 1.12, contact.y - 0.62, contact.z);
    blade.rotation.set(0.0, -0.5 + tx * 0.2, -0.46);
    glow.position.copy(contact).add(tmp.set(0.1, 0.25, 0.9));
  }

  function spawn(dt: number) {
    acc += (200 + 300 * boost) * dt;
    while (acc >= 1) {
      acc -= 1;
      const i = cursor;
      cursor = (cursor + 1) % SPARKS;
      const speed = 2.6 + Math.random() * 5.2 + boost * 1.5;
      const spread = 0.55;
      pos[i * 3] = contact.x + (Math.random() - 0.5) * 0.12;
      pos[i * 3 + 1] = contact.y + (Math.random() - 0.5) * 0.12;
      pos[i * 3 + 2] = contact.z + (Math.random() - 0.5) * 0.35;
      vel[i * 3] = tangent.x * speed + (Math.random() - 0.5) * spread * 2;
      vel[i * 3 + 1] = tangent.y * speed + (Math.random() - 0.1) * spread * 2;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
      maxLife[i] = life[i] = 0.35 + Math.random() * 0.75;
      warm[i] = Math.random() < 0.24 ? 1 : 0;
    }
  }

  function step(dt: number) {
    angle += (2.3 + boost * 4.2) * dt;
    spinner.rotation.y = angle;
    place();
    spawn(dt);
    for (let i = 0; i < SPARKS; i++) {
      const o = i * 3;
      const l = i * 6;
      if (life[i] <= 0) {
        for (let k = 0; k < 6; k++) {
          linePos[l + k] = 9999;
          lineCol[l + k] = 0;
        }
        pos[o] = 9999;
        headCol[o] = headCol[o + 1] = headCol[o + 2] = 0;
        continue;
      }
      life[i] -= dt;
      vel[o + 1] -= 9.2 * dt;
      const hx = (pos[o] += vel[o] * dt);
      const hy = (pos[o + 1] += vel[o + 1] * dt);
      const hz = (pos[o + 2] += vel[o + 2] * dt);
      const t = Math.max(0, life[i] / maxLife[i]);
      const fade = Math.pow(t, 0.7);
      const r = warm[i] ? 1 : 0.35 + 0.65 * t;
      const gch = warm[i] ? 0.45 + 0.4 * t : 0.6 + 0.38 * t;
      const b = warm[i] ? 0.2 + 0.4 * t : 1;
      linePos[l] = hx;
      linePos[l + 1] = hy;
      linePos[l + 2] = hz;
      linePos[l + 3] = hx - vel[o] * 0.07;
      linePos[l + 4] = hy - vel[o + 1] * 0.07;
      linePos[l + 5] = hz - vel[o + 2] * 0.07;
      lineCol[l] = r * fade * 1.4;
      lineCol[l + 1] = gch * fade * 1.4;
      lineCol[l + 2] = b * fade * 1.4;
      lineCol[l + 3] = r * fade * 0.25;
      lineCol[l + 4] = gch * fade * 0.25;
      lineCol[l + 5] = b * fade * 0.25;
      headCol[o] = r * fade;
      headCol[o + 1] = gch * fade;
      headCol[o + 2] = b * fade;
    }
    glow.intensity = 1.5 + boost * 2 + Math.random() * 1.6;
    (lines.geometry.attributes.position as import("three").BufferAttribute).needsUpdate = true;
    (lines.geometry.attributes.color as import("three").BufferAttribute).needsUpdate = true;
    (heads.geometry.attributes.position as import("three").BufferAttribute).needsUpdate = true;
    (heads.geometry.attributes.color as import("three").BufferAttribute).needsUpdate = true;
  }

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // Pointer tilts the whole rig; scrolling spins the wheel up.
  const onPointer = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const onScroll = () => {
    boost = Math.min(1.4, window.scrollY / Math.max(1, window.innerHeight * 0.8));
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  let raf = 0;
  let visible = true;
  let last = performance.now();
  // Adaptive quality: if the first second of frames is slow, drop to 1x resolution.
  let frames = 0;
  let elapsed = 0;
  const loop = (now: number) => {
    const rawDt = (now - last) / 1000;
    const dt = Math.min(0.033, rawDt);
    last = now;
    if (frames < 60) {
      frames += 1;
      elapsed += rawDt;
      if (frames === 60 && elapsed / 60 > 0.034 && renderer.getPixelRatio() > 1) {
        renderer.setPixelRatio(1);
        resize();
      }
    }
    px += (tx - px) * Math.min(1, dt * 4);
    py += (ty - py) * Math.min(1, dt * 4);
    step(dt);
    renderer.render(scene, camera);
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  };

  const resume = () => {
    if (!raf && visible && !document.hidden && !reduced) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) resume();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", resume);

  if (reduced) {
    // A single, pre-warmed frame: the wheel and a frozen spray, no motion.
    for (let i = 0; i < 46; i++) step(1 / 30);
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(loop);
  }

  return () => {
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", resume);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("scroll", onScroll);
    scene.traverse((o) => {
      const m = o as import("three").Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as import("three").Material | import("three").Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    side.dispose();
    face.dispose();
    renderer.dispose();
    canvas.remove();
  };
}

/** A still, drawn wheel for browsers without WebGL. */
function FlatWheel() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label="A grinding wheel throwing sparks">
      <defs>
        <radialGradient id="stone" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#3a4455" />
          <stop offset="1" stopColor="#1b212c" />
        </radialGradient>
      </defs>
      <circle cx="190" cy="210" r="130" fill="url(#stone)" stroke="#323c4e" strokeWidth="3" />
      <circle cx="190" cy="210" r="34" fill="#9aa7ba" />
      <g stroke="#f4fbff" strokeLinecap="round" strokeWidth="3">
        <path d="M290 275l50-60M296 285l62-34M286 268l38-78M300 292l70-12" />
      </g>
      <g stroke="#5cc8ff" strokeLinecap="round" strokeWidth="2" opacity=".7">
        <path d="M304 300l60-6M292 280l56-52" />
      </g>
    </svg>
  );
}

export function GrindWheel({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;
        // ?still renders one pre-warmed frame, the same as reduced motion (handy for previews).
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(window.location.search).has("still");
        cleanup = start(THREE, el, reduced);
      } catch {
        if (!disposed) setFallback(true);
      }
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={host} className={className} aria-hidden={!fallback}>
      {fallback && <FlatWheel />}
    </div>
  );
}
