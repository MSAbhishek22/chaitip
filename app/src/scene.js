// ChaiTip — 3D chai glass with falling coins (Three.js).
// Each coin is a real confirmed tip: dropCoin() is called once per tip.
// Lazy-loaded by main.js; if WebGL is unavailable the caller renders the
// 2D fallback instead and never calls this module.

import * as THREE from 'three';

export function initScene(canvas, { onCoinClick } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 1.6, 5.2);
  camera.lookAt(0, 0.4, 0);

  // Warm stall lighting: key marigold, cool green rim.
  scene.add(new THREE.AmbientLight(0xfff6e5, 0.55));
  const key = new THREE.DirectionalLight(0xffb000, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x2e9e6b, 0.8);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  // Counter.
  const counter = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.4, 0.25, 48),
    new THREE.MeshStandardMaterial({ color: 0x123527, roughness: 0.85 })
  );
  counter.position.y = -0.62;
  scene.add(counter);

  // Chai glass: lathe profile, amber, translucent.
  const pts = [];
  pts.push(new THREE.Vector2(0.0, -0.5));
  pts.push(new THREE.Vector2(0.62, -0.5));
  pts.push(new THREE.Vector2(0.72, 0.35));
  pts.push(new THREE.Vector2(0.78, 0.62));
  pts.push(new THREE.Vector2(0.78, 0.66));
  pts.push(new THREE.Vector2(0.7, 0.66));
  pts.push(new THREE.Vector2(0.66, 0.35));
  pts.push(new THREE.Vector2(0.56, -0.42));
  pts.push(new THREE.Vector2(0.0, -0.42));
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0xc97b1e, transparent: true, opacity: 0.82,
      roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide,
    })
  );
  scene.add(glass);

  // Chai surface inside the glass.
  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(0.66, 48),
    new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.4 })
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.52;
  scene.add(surface);

  // Steam: three soft sprites drifting up (opacity animated in tick).
  const steamMat = new THREE.SpriteMaterial({ color: 0xfff6e5, transparent: true, opacity: 0.16 });
  const steams = [0, 1, 2].map((i) => {
    const s = new THREE.Sprite(steamMat.clone());
    s.scale.set(0.5, 0.9, 1);
    s.position.set(-0.25 + i * 0.25, 0.9, 0);
    scene.add(s);
    return s;
  });

  // Coins.
  const coinGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.07, 32);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xffb000, roughness: 0.3, metalness: 0.85 });
  const coins = [];
  let falling = null;

  const group = new THREE.Group();
  group.add(glass, surface, counter);
  scene.add(group);

  function layoutCoin(coin, index) {
    // Stack coins in a loose pile inside the glass, rising with count.
    const layer = Math.floor(index / 3);
    const angle = (index % 3) * 2.1 + layer * 0.7;
    const r = 0.16 + (index % 2) * 0.08;
    coin.position.set(Math.cos(angle) * r, -0.32 + layer * 0.09, Math.sin(angle) * r);
    coin.rotation.set(Math.PI / 2 + (index % 5) * 0.12, 0, (index % 7) * 0.35);
  }

  function dropCoin(receiptId) {
    const coin = new THREE.Mesh(coinGeo, coinMat.clone());
    coin.userData.receiptId = receiptId || null;
    coin.position.set((Math.random() - 0.5) * 0.5, 3.2, (Math.random() - 0.5) * 0.3);
    coin.rotation.set(Math.random(), Math.random(), Math.random());
    scene.add(coin);
    falling = { coin, vy: 0 };
    coins.push(coin);
    return coin;
  }

  function setCoinCount(n, receiptIds = []) {
    while (coins.length < n) {
      const coin = new THREE.Mesh(coinGeo, coinMat.clone());
      coin.userData.receiptId = receiptIds[coins.length] || null;
      layoutCoin(coin, coins.length);
      scene.add(coin);
      coins.push(coin);
    }
  }

  // Pointer orbit (drag) + click a coin to highlight its receipt.
  let dragging = false, px = 0, py = 0, rotY = 0, rotX = 0;
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  canvas.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    rotY += (e.clientX - px) * 0.008;
    rotX = Math.max(-0.3, Math.min(0.45, rotX + (e.clientY - py) * 0.005));
    px = e.clientX; py = e.clientY;
  });
  canvas.addEventListener('click', (e) => {
    if (dragging) return;
    const rect = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(coins, false)[0];
    if (hit && hit.object.userData.receiptId && onCoinClick) onCoinClick(hit.object.userData.receiptId);
  });

  function resize() {
    const w = canvas.clientWidth || 560;
    const h = canvas.clientHeight || 260;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let raf = null;
  let running = true;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();

  function tick() {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();
    group.rotation.y = rotY;
    group.rotation.x = rotX;
    // Steam drift (disabled under reduced motion).
    if (!reduced) {
      steams.forEach((s, i) => {
        s.position.y = 0.9 + ((t * 0.25 + i * 0.33) % 1) * 0.9;
        s.material.opacity = 0.16 * (1 - ((t * 0.25 + i * 0.33) % 1));
      });
    }
    // Falling coin physics: gravity, land in the pile.
    if (falling) {
      falling.vy += 0.09;
      falling.coin.position.y -= falling.vy * 0.12;
      falling.coin.rotation.x += 0.18;
      const targetY = -0.32 + Math.floor((coins.length - 1) / 3) * 0.09;
      if (falling.coin.position.y <= targetY) {
        layoutCoin(falling.coin, coins.length - 1);
        falling = null;
      }
    }
    renderer.render(scene, camera);
  }
  tick();

  return {
    dropCoin,
    setCoinCount,
    coinCount: () => coins.length,
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}
