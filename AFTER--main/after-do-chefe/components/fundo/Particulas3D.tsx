"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Partículas douradas flutuando em 3D. Só é carregado em aparelhos capazes —
 * quem decide é FundoAnimado, via dynamic import (three.js fica fora do bundle
 * inicial).
 *
 * Escolhas feitas por causa de performance no celular:
 *  - `dpr={[1, 1.5]}`: limita o devicePixelRatio. Sem isso, um iPhone renderiza
 *    a 3x e o fillrate come o frame inteiro.
 *  - `powerPreference: "low-power"` + `antialias: false`: o efeito é borrado por
 *    natureza, antialias aqui seria custo puro.
 *  - Um único `THREE.Points` com uma geometria: 1 draw call para tudo.
 *  - O movimento é feito rotacionando o grupo inteiro na GPU; nenhum atributo
 *    de posição é reescrito por frame na CPU.
 *  - `frameloop` pausa sozinho quando a aba sai de foco (padrão do fiber com
 *    `invalidate`, aqui garantido pelo listener de visibilidade).
 */

const COR_OURO = new THREE.Color("#E7C873");

function Particulas({ quantidade }: { quantidade: number }) {
  const grupo = useRef<THREE.Points>(null);

  const geometria = useMemo(() => {
    const posicoes = new Float32Array(quantidade * 3);
    const tamanhos = new Float32Array(quantidade);

    for (let i = 0; i < quantidade; i++) {
      // Distribuição em casca esférica: mantém o miolo da tela livre pro texto.
      const raio = 6 + Math.random() * 7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      posicoes[i * 3] = raio * Math.sin(phi) * Math.cos(theta);
      posicoes[i * 3 + 1] = raio * Math.sin(phi) * Math.sin(theta) * 0.6;
      posicoes[i * 3 + 2] = raio * Math.cos(phi);
      tamanhos[i] = 0.04 + Math.random() * 0.09;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posicoes, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(tamanhos, 1));
    return geo;
  }, [quantidade]);

  // Textura de partícula gerada em canvas — evita baixar um PNG só pra isso.
  const textura = useMemo(() => {
    const tamanho = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = tamanho;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,244,214,1)");
      g.addColorStop(0.35, "rgba(231,200,115,0.55)");
      g.addColorStop(1, "rgba(201,162,75,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, tamanho, tamanho);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (!grupo.current) return;
    // Rotação lenta: a leitura do hero não pode competir com o fundo.
    grupo.current.rotation.y += delta * 0.028;
    grupo.current.rotation.x += delta * 0.011;
  });

  return (
    <points ref={grupo} geometry={geometria}>
      <pointsMaterial
        map={textura}
        color={COR_OURO}
        size={0.13}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Particulas3D() {
  // Menos partículas em tela pequena: metade do trabalho de fillrate.
  const quantidade =
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches ? 420 : 900;

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 13], fov: 55 }}
      gl={{ antialias: false, powerPreference: "low-power", alpha: true }}
      // A cena não muda por interação; renderiza continuamente mas leve.
      frameloop="always"
    >
      <Particulas quantidade={quantidade} />
    </Canvas>
  );
}
