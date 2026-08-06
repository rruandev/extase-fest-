/**
 * Gera os assets derivados da marca a partir do emblema em alta resolução.
 *
 *   public/marca/rr-lounge-emblema.png  (2000x2000, fonte da verdade)
 *     -> app/icon.png            favicon (Next serve automaticamente)
 *     -> app/apple-icon.png      ícone de home screen no iOS
 *     -> public/og-rr-lounge.jpg imagem de compartilhamento (1200x630)
 *
 * Rode com: npm run assets
 * Só precisa rodar de novo se o arquivo do emblema mudar.
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const EMBLEMA = "public/marca/rr-lounge-emblema.png";

// Mesmo fundo do emblema, pra não aparecer emenda entre a arte e a moldura.
const FUNDO_OG = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="72%">
      <stop offset="0%" stop-color="#181613"/>
      <stop offset="55%" stop-color="#0d0c0a"/>
      <stop offset="100%" stop-color="#050505"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
</svg>`;

async function main() {
  await mkdir("app", { recursive: true });

  // Favicon e ícone do iOS — quadrados, direto do emblema.
  await sharp(EMBLEMA).resize(256, 256).png({ quality: 90 }).toFile("app/icon.png");
  await sharp(EMBLEMA).resize(180, 180).png({ quality: 90 }).toFile("app/apple-icon.png");

  // OG: emblema centralizado sobre o mesmo gradiente, deixando respiro nas laterais.
  const emblema = await sharp(EMBLEMA).resize(560, 560).png().toBuffer();

  await sharp(Buffer.from(FUNDO_OG))
    .composite([{ input: emblema, gravity: "centre" }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile("public/og-rr-lounge.jpg");

  await gerarPlaceholdersGaleria();

  console.log("assets gerados: app/icon.png, app/apple-icon.png, public/og-rr-lounge.jpg");
}

/**
 * Placeholders da galeria — só cria os que ainda não existem, então assim que
 * você jogar a foto real por cima do arquivo, ela fica. Ao trocar todas, o
 * script não sobrescreve nada.
 */
async function gerarPlaceholdersGaleria() {
  await mkdir("public/galeria", { recursive: true });

  const marca = await sharp(EMBLEMA).resize(420, 420).png().toBuffer();
  let criados = 0;

  for (let i = 1; i <= 6; i++) {
    const destino = `public/galeria/foto-${String(i).padStart(2, "0")}.jpg`;
    if (existsSync(destino)) continue;

    // Um leve deslocamento por índice pra os seis não ficarem idênticos.
    const angulo = (i * 47) % 360;
    const fundo = `
      <svg width="900" height="900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g" cx="${35 + (i % 3) * 15}%" cy="${30 + (i % 2) * 25}%" r="80%">
            <stop offset="0%" stop-color="#221d16"/>
            <stop offset="50%" stop-color="#100e0c"/>
            <stop offset="100%" stop-color="#050505"/>
          </radialGradient>
        </defs>
        <rect width="900" height="900" fill="url(#g)"/>
      </svg>`;

    await sharp(Buffer.from(fundo))
      .composite([
        {
          input: await sharp(marca).rotate(angulo, { background: "#00000000" }).toBuffer(),
          gravity: "centre",
          blend: "overlay",
        },
      ])
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(destino);

    criados++;
  }

  if (criados) console.log(`placeholders da galeria criados: ${criados}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
