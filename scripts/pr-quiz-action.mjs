// Pegamento entre el núcleo (pr-quiz.mjs) y la API de GitHub.
// Se llama desde actions/github-script en .github/workflows/pr-quiz.yml.
import {
  MARCA,
  MAX_INTENTOS,
  generarQuiz,
  crearMeta,
  renderComentario,
  leerMeta,
  parsearRespuestas,
  corregir,
} from './pr-quiz.mjs';

const CONTEXTO = 'pr-quiz';

function secreto() {
  const valor = process.env.QUIZ_SECRET;
  if (!valor) throw new Error('Falta el secreto QUIZ_SECRET (Settings → Secrets and variables → Actions).');
  return valor;
}

async function buscarQuiz(github, repo, numero) {
  const comentarios = await github.paginate(github.rest.issues.listComments, {
    ...repo,
    issue_number: numero,
    per_page: 100,
  });
  return comentarios.reverse().find((c) => c.user?.type === 'Bot' && c.body?.includes(MARCA));
}

function ponerEstado(github, repo, sha, state, description) {
  return github.rest.repos.createCommitStatus({
    ...repo,
    sha,
    state,
    context: CONTEXTO,
    description: description.slice(0, 140),
  });
}

// pull_request_target: opened / synchronize / reopened
export async function generar({ github, context }) {
  const repo = context.repo;
  const pr = context.payload.pull_request;
  const sha = pr.head.sha;

  const archivos = await github.paginate(github.rest.pulls.listFiles, {
    ...repo,
    pull_number: pr.number,
    per_page: 100,
  });
  const { data: arbol } = await github.rest.git.getTree({ ...repo, tree_sha: sha, recursive: 'true' });
  const archivosRepo = arbol.tree.filter((n) => n.type === 'blob').map((n) => n.path);

  const preguntas = generarQuiz({ archivos, archivosRepo, semilla: sha });
  const meta = crearMeta(preguntas, secreto(), sha);
  const body = renderComentario(meta);

  const previo = await buscarQuiz(github, repo, pr.number);
  if (previo) await github.rest.issues.updateComment({ ...repo, comment_id: previo.id, body });
  else await github.rest.issues.createComment({ ...repo, issue_number: pr.number, body });

  await ponerEstado(github, repo, sha, 'pending', `Responde el quiz del PR con /quiz y ${preguntas.length} letras`);
}

// issue_comment: created (el workflow ya filtró que sea un PR y empiece por /quiz)
export async function responder({ github, context }) {
  const repo = context.repo;
  const { issue, comment } = context.payload;
  const contestar = (texto) =>
    github.rest.issues.createComment({ ...repo, issue_number: issue.number, body: `@${comment.user.login} ${texto}` });

  if (comment.user.login !== issue.user.login) return contestar('solo la persona autora del PR responde el quiz.');

  const { data: pr } = await github.rest.pulls.get({ ...repo, pull_number: issue.number });
  if (pr.state !== 'open') return contestar('el PR ya no está abierto.');

  const quiz = await buscarQuiz(github, repo, issue.number);
  const meta = quiz && leerMeta(quiz.body);
  if (!meta || meta.sha !== pr.head.sha) {
    return contestar('todavía no hay quiz para el último commit. Espera a que termine el workflow y responde otra vez.');
  }
  if (meta.estado === 'aprobado') return contestar('este quiz ya está aprobado ✅');
  if (meta.estado === 'agotado') return contestar('ya no quedan intentos. Sube un commit nuevo para recibir otro quiz.');

  const leido = parsearRespuestas(comment.body, meta.preguntas.length);
  if (leido.error) return contestar(leido.error);

  const { aciertos, total } = corregir(meta, leido.respuestas, secreto());
  meta.intentos += 1;
  if (aciertos === total) meta.estado = 'aprobado';
  else if (meta.intentos >= MAX_INTENTOS) meta.estado = 'agotado';

  await github.rest.issues.updateComment({ ...repo, comment_id: quiz.id, body: renderComentario(meta) });

  if (meta.estado === 'aprobado') {
    await ponerEstado(github, repo, meta.sha, 'success', `Quiz aprobado (${aciertos}/${total})`);
    return contestar(`✅ ¡${aciertos}/${total} correctas! El check \`pr-quiz\` queda en verde.`);
  }
  if (meta.estado === 'agotado') {
    await ponerEstado(github, repo, meta.sha, 'failure', `${aciertos}/${total} correctas, sin intentos`);
    return contestar(
      `❌ ${aciertos}/${total} correctas y no quedan intentos. Revisa la pestaña **Files changed** y sube un commit nuevo para otro quiz.`,
    );
  }
  const quedan = MAX_INTENTOS - meta.intentos;
  await ponerEstado(github, repo, meta.sha, 'pending', `${aciertos}/${total} correctas, quedan ${quedan} intentos`);
  return contestar(`${aciertos}/${total} correctas. Te quedan ${quedan} intento(s).`);
}
