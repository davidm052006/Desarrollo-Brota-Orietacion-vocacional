import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LETRAS,
  generarQuiz,
  crearMeta,
  renderComentario,
  leerMeta,
  parsearRespuestas,
  corregir,
  identificadores,
  vecinos,
} from './pr-quiz.mjs';

const SECRETO = 'secreto-de-prueba';
const SHA = 'abc123';

const archivos = [
  {
    filename: 'src/edad.mjs',
    status: 'modified',
    additions: 12,
    deletions: 3,
    patch: '@@ -1,3 +1,12 @@\n function calcularEdad(fecha) {\n-  const hoy = new Date();\n+export function esMayorDeEdad(fecha) {\n+  const limite = 18;',
  },
  { filename: 'src/nuevo.mjs', status: 'added', additions: 4, deletions: 0, patch: '@@ -0,0 +1,4 @@\n+export const VERSION = 1;' },
  { filename: 'README.md', status: 'modified', additions: 1, deletions: 1, patch: '@@ -1 +1 @@\n-# Viejo\n+# Nuevo' },
];
const archivosRepo = ['src/edad.mjs', 'src/nuevo.mjs', 'README.md', 'package.json', 'tests/edad.test.mjs', '.gitignore'];

test('el quiz es determinista para el mismo commit', () => {
  const a = generarQuiz({ archivos, archivosRepo, semilla: SHA });
  const b = generarQuiz({ archivos, archivosRepo, semilla: SHA });
  assert.deepEqual(a, b);
  assert.equal(a.length, 4);
});

test('cada pregunta tiene una respuesta válida y opciones sin repetir', () => {
  for (const semilla of ['s1', 's2', 's3', 's4', 's5']) {
    for (const p of generarQuiz({ archivos, archivosRepo, semilla })) {
      assert.ok(p.opciones.length >= 3 && p.opciones.length <= 4, p.id);
      assert.equal(new Set(p.opciones).size, p.opciones.length, p.id);
      assert.ok(LETRAS.slice(0, p.opciones.length).includes(p.correcta), p.id);
    }
  }
});

test('las respuestas correctas corresponden al PR', () => {
  const quiz = generarQuiz({ archivos, archivosRepo, semilla: SHA, maximo: 10 });
  const respuesta = (id) => {
    const p = quiz.find((q) => q.id === id);
    return p.opciones[LETRAS.indexOf(p.correcta)];
  };
  assert.ok(archivos.some((a) => a.filename === respuesta('archivo')));
  assert.equal(respuesta('nuevo'), 'src/nuevo.mjs');
  assert.equal(respuesta('mas-cambios'), 'src/edad.mjs');
  assert.ok(['esMayorDeEdad', 'limite', 'VERSION'].includes(respuesta('identificador')));
  assert.equal(respuesta('lineas'), '17');
  assert.equal(respuesta('cantidad'), '3');
});

test('sin distractores suficientes la pregunta se omite', () => {
  const uno = [{ filename: 'a.txt', status: 'modified', additions: 1, deletions: 0, patch: '@@\n+hola' }];
  const quiz = generarQuiz({ archivos: uno, archivosRepo: ['a.txt'], semilla: SHA });
  assert.deepEqual(quiz.map((p) => p.id).sort(), ['cantidad', 'lineas']);
});

test('identificadores separa líneas agregadas del resto', () => {
  const patch = archivos[0].patch;
  assert.deepEqual(identificadores(patch, ['+']), ['esMayorDeEdad', 'limite']);
  assert.deepEqual(identificadores(patch, [' ', '-']), ['calcularEdad', 'hoy']);
});

test('vecinos nunca incluye el valor ni negativos', () => {
  assert.deepEqual(vecinos(0), [1, 2]);
  assert.ok(!vecinos(1, 1).includes(1));
  assert.ok(vecinos(1, 1).every((v) => v >= 1));
});

test('el comentario guarda la meta sin las respuestas en claro', () => {
  const quiz = generarQuiz({ archivos, archivosRepo, semilla: SHA });
  const meta = crearMeta(quiz, SECRETO, SHA);
  const body = renderComentario(meta);
  assert.deepEqual(leerMeta(body), meta);
  assert.ok(!JSON.stringify(meta.preguntas).includes('correcta'));
});

test('un ">" en una opción no rompe el comentario HTML', () => {
  const meta = crearMeta([{ id: 'x', texto: 'a --> b', opciones: ['-->', 'b', 'c'], correcta: 'A' }], SECRETO, SHA);
  assert.deepEqual(leerMeta(renderComentario(meta)), meta);
});

test('corregir cuenta aciertos con la firma y el secreto', () => {
  const quiz = generarQuiz({ archivos, archivosRepo, semilla: SHA });
  const meta = crearMeta(quiz, SECRETO, SHA);
  const buenas = quiz.map((p) => p.correcta);
  assert.deepEqual(corregir(meta, buenas, SECRETO), { aciertos: 4, total: 4 });

  const malas = quiz.map((p) => LETRAS.find((l) => l !== p.correcta));
  assert.equal(corregir(meta, malas, SECRETO).aciertos, 0);
  assert.equal(corregir(meta, buenas, 'otro-secreto').aciertos, 0);
});

test('parsearRespuestas acepta varios formatos', () => {
  for (const texto of ['/quiz A C B D', '/quiz ACBD', '/quiz 1A 2C 3B 4D', '/QUIZ a,c,b,d', '/quiz 1) a 2) c 3) b 4) d']) {
    assert.deepEqual(parsearRespuestas(texto, 4), { respuestas: ['A', 'C', 'B', 'D'] }, texto);
  }
});

test('parsearRespuestas rechaza cantidad o letras inválidas', () => {
  assert.match(parsearRespuestas('/quiz A B', 4).error, /4 preguntas/);
  assert.match(parsearRespuestas('/quiz A B C E', 4).error, /A, B, C y D/);
  assert.ok(parsearRespuestas('hola', 4).error);
});
