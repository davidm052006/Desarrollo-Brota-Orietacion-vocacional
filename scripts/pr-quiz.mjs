// Núcleo del quiz de PR: funciones puras, sin llamadas a GitHub.
// Genera preguntas a partir de los archivos del PR, firma las respuestas
// correctas con HMAC (QUIZ_SECRET) y corrige lo que responde la persona autora.
import { createHash, createHmac } from 'node:crypto';

export const MARCA = '<!-- pr-quiz -->';
export const MAX_INTENTOS = 3;
export const LETRAS = ['A', 'B', 'C', 'D'];
const META_RE = /<!-- pr-quiz-meta (\{.*?\}) -->/s;

// Azar determinista a partir de una semilla (el SHA del commit).
export function crearAzar(semilla) {
  let bloque = createHash('sha256').update(String(semilla)).digest();
  let i = 0;
  return () => {
    if (i + 4 > bloque.length) {
      bloque = createHash('sha256').update(bloque).digest();
      i = 0;
    }
    const valor = bloque.readUInt32BE(i);
    i += 4;
    return valor / 2 ** 32;
  };
}

export function barajar(lista, azar) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const unicos = (lista) => [...new Set(lista)];
const alAzar = (lista, azar) => lista[Math.floor(azar() * lista.length)];
const cambios = (archivo) => archivo.additions + archivo.deletions;

function armar(id, texto, correcta, distractores, azar) {
  const otros = barajar(unicos(distractores).filter((d) => d !== correcta), azar).slice(0, 3);
  if (otros.length < 2) return null;
  const opciones = barajar([correcta, ...otros], azar);
  return { id, texto, opciones, correcta: LETRAS[opciones.indexOf(correcta)] };
}

const DECLARACION = /\b(?:function|class|const|let|var|def|interface|type)\s+([A-Za-z_$][\w$]*)/g;

// Nombres declarados en las líneas del patch cuyo prefijo está en `prefijos`
// ('+' agregadas, '-' borradas, ' ' contexto). El patch de la API no trae
// cabeceras ---/+++, solo bloques @@.
export function identificadores(patch = '', prefijos) {
  const nombres = [];
  for (const linea of patch.split('\n')) {
    if (linea.startsWith('@@') || !prefijos.includes(linea[0])) continue;
    for (const m of linea.slice(1).matchAll(DECLARACION)) nombres.push(m[1]);
  }
  return unicos(nombres);
}

export function vecinos(n, minimo = 0) {
  const paso = Math.max(1, Math.round(n * 0.25));
  return unicos([n + paso, n - paso, n + 2 * paso, n - 2 * paso, n + 1, n - 1]).filter(
    (v) => v >= minimo && v !== n,
  );
}

// archivos: salida de pulls.listFiles ({ filename, status, additions, deletions, patch }).
// archivosRepo: rutas del repositorio, para sacar distractores.
export function generarQuiz({ archivos, archivosRepo = [], semilla, maximo = 4 }) {
  const azar = crearAzar(semilla);
  const enPr = new Set(archivos.map((a) => a.filename));
  const fuera = archivosRepo.filter((ruta) => !enPr.has(ruta));
  const contenido = [];

  if (archivos.length) {
    contenido.push(
      armar('archivo', '¿Cuál de estos archivos modifica este PR?', alAzar(archivos, azar).filename, fuera, azar),
    );
  }

  const nuevos = archivos.filter((a) => a.status === 'added').map((a) => a.filename);
  if (nuevos.length) {
    const existentes = [...archivos.filter((a) => a.status !== 'added').map((a) => a.filename), ...fuera];
    contenido.push(armar('nuevo', '¿Qué archivo crea este PR?', alAzar(nuevos, azar), existentes, azar));
  }

  const porCambios = [...archivos].sort((a, b) => cambios(b) - cambios(a));
  if (porCambios.length >= 3 && cambios(porCambios[0]) > cambios(porCambios[1])) {
    contenido.push(
      armar(
        'mas-cambios',
        '¿Qué archivo tiene más líneas cambiadas (agregadas + borradas)?',
        porCambios[0].filename,
        porCambios.slice(1).map((a) => a.filename),
        azar,
      ),
    );
  }

  const agregados = unicos(archivos.flatMap((a) => identificadores(a.patch, ['+'])));
  if (agregados.length) {
    const otros = unicos(archivos.flatMap((a) => identificadores(a.patch, [' ', '-']))).filter(
      (n) => !agregados.includes(n),
    );
    contenido.push(
      armar('identificador', '¿Qué nombre declara el PR en sus líneas agregadas?', alAzar(agregados, azar), otros, azar),
    );
  }

  const agregadas = archivos.reduce((suma, a) => suma + a.additions, 0);
  const numericas = [
    armar('lineas', '¿Cuántas líneas agrega el PR en total?', String(agregadas), vecinos(agregadas).map(String), azar),
    armar('cantidad', '¿Cuántos archivos cambia el PR?', String(archivos.length), vecinos(archivos.length, 1).map(String), azar),
  ];

  // Primero las de contenido; las numéricas solo rellenan.
  return [...barajar(contenido.filter(Boolean), azar), ...barajar(numericas.filter(Boolean), azar)].slice(0, maximo);
}

export function firmar(secreto, sha, id, letra) {
  return createHmac('sha256', secreto).update(`${sha}:${id}:${letra}`).digest('hex');
}

// Lo que se guarda (oculto) en el comentario: preguntas sin la respuesta y su firma.
export function crearMeta(preguntas, secreto, sha) {
  return {
    sha,
    intentos: 0,
    estado: 'pendiente',
    preguntas: preguntas.map(({ id, texto, opciones }) => ({ id, texto, opciones })),
    claves: Object.fromEntries(preguntas.map((p) => [p.id, firmar(secreto, sha, p.id, p.correcta)])),
  };
}

function lineaEstado(meta) {
  if (meta.estado === 'aprobado') return '✅ **Quiz aprobado.**';
  if (meta.estado === 'agotado') return '❌ **Sin intentos.** Sube un commit nuevo para recibir otro quiz.';
  return `⏳ Intentos usados: ${meta.intentos}/${MAX_INTENTOS}`;
}

export function renderComentario(meta) {
  const n = meta.preguntas.length;
  const lineas = [
    MARCA,
    '## 🧠 Quiz del PR',
    '',
    'Antes de fusionar, demuestra que conoces tu propio cambio. Responde en un **comentario nuevo** con una letra por pregunta, en orden:',
    '',
    '```',
    `/quiz ${LETRAS.slice(0, n).join(' ')}`,
    '```',
    '',
    `Tienes ${MAX_INTENTOS} intentos por commit y solo responde la persona autora del PR. Un commit nuevo genera otro quiz.`,
    '',
  ];
  meta.preguntas.forEach((p, i) => {
    lineas.push(`**${i + 1}. ${p.texto}**`, '');
    p.opciones.forEach((opcion, j) => lineas.push(`- ${LETRAS[j]}) \`${opcion}\``));
    lineas.push('');
  });
  // '>' escapado para que el JSON no pueda cerrar el comentario HTML.
  const json = JSON.stringify(meta).replace(/>/g, '\\u003e');
  lineas.push(lineaEstado(meta), '', `<!-- pr-quiz-meta ${json} -->`);
  return lineas.join('\n');
}

export function leerMeta(body = '') {
  const m = body.match(META_RE);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

// Acepta "/quiz A C B D", "/quiz ACBD", "/quiz 1A 2C 3B 4D" o "/quiz a,c,b,d".
export function parsearRespuestas(texto, n) {
  const m = texto.trim().split('\n')[0].match(/^\/quiz\s+(.+)$/i);
  if (!m) return { error: `usa el formato \`/quiz ${LETRAS.slice(0, n).join(' ')}\`.` };
  const letras = m[1].toUpperCase().replace(/\d+\s*[).:-]?/g, '').match(/[A-Z]/g) ?? [];
  if (letras.some((l) => !LETRAS.includes(l))) return { error: 'solo valen las letras A, B, C y D.' };
  if (letras.length !== n) return { error: `el quiz tiene ${n} preguntas y enviaste ${letras.length} respuestas. Este intento no cuenta.` };
  return { respuestas: letras };
}

export function corregir(meta, respuestas, secreto) {
  const aciertos = meta.preguntas.filter(
    (p, i) => firmar(secreto, meta.sha, p.id, respuestas[i]) === meta.claves[p.id],
  ).length;
  return { aciertos, total: meta.preguntas.length };
}
