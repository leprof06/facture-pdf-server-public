// 📁 utils/pdfQueue.js
// File d'attente robuste pour la génération PDF en environnement serverless (Vercel).
// - Concurrence configurable (par défaut: 1)
// - Timeout par tâche (par défaut: 25s) pour ne pas bloquer un webhook Stripe
// - Limite de queue (par défaut: illimitée; peut être fixée)
// - Logs simples et sûrs

/**
 * Options de queue globales (modifiable par configurePDFQueue).
 */
const config = {
  concurrency: 1,       // 1 = exécution strictement séquentielle
  defaultTimeoutMs: 25000, // 25s; ajuste selon maxDuration de ta fonction
  maxQueueSize: Infinity,  // limite facultative (Infinity = pas de limite)
};

let activeCount = 0;
const queue = [];

/**
 * Configure les paramètres globaux de la queue.
 * @param {Object} opts
 * @param {number} [opts.concurrency=1]
 * @param {number} [opts.defaultTimeoutMs=25000]
 * @param {number} [opts.maxQueueSize=Infinity]
 */
export function configurePDFQueue(opts = {}) {
  if (Number.isInteger(opts.concurrency) && opts.concurrency >= 1) {
    config.concurrency = opts.concurrency;
  }
  if (Number.isInteger(opts.defaultTimeoutMs) && opts.defaultTimeoutMs >= 0) {
    config.defaultTimeoutMs = opts.defaultTimeoutMs;
  }
  if (Number.isInteger(opts.maxQueueSize) && opts.maxQueueSize >= 0) {
    config.maxQueueSize = opts.maxQueueSize;
  }
}

/**
 * Ajoute une tâche dans la file et retourne une Promise du résultat.
 * @param {() => Promise<any>} taskFn  Fonction asynchrone qui génère le Buffer PDF
 * @param {{ timeoutMs?: number, label?: string }} [options]
 */
export function enqueuePDF(taskFn, options = {}) {
  if (typeof taskFn !== "function") {
    return Promise.reject(new Error("enqueuePDF: taskFn doit être une fonction"));
  }
  if (queue.length >= config.maxQueueSize) {
    return Promise.reject(new Error("enqueuePDF: file d'attente saturée"));
  }

  const timeoutMs = Number.isInteger(options.timeoutMs) ? options.timeoutMs : config.defaultTimeoutMs;
  const label = options.label || "pdf-task";

  return new Promise((resolve, reject) => {
    queue.push({ taskFn, timeoutMs, label, resolve, reject });
    // On déclenche le scheduling hors pile courante
    setTimeout(processQueue, 0);
  });
}

async function processQueue() {
  while (activeCount < config.concurrency && queue.length > 0) {
    const { taskFn, timeoutMs, label, resolve, reject } = queue.shift();
    activeCount++;

    runWithTimeout(taskFn, timeoutMs, label)
      .then((result) => resolve(result))
      .catch((err) => reject(err))
      .finally(() => {
        activeCount--;
        // Replanifie la suite pour éviter une récursion profonde
        if (queue.length > 0) setTimeout(processQueue, 0);
      });
  }
}

/**
 * Exécute une tâche avec timeout.
 * @param {() => Promise<any>} taskFn
 * @param {number} timeoutMs
 * @param {string} label
 */
async function runWithTimeout(taskFn, timeoutMs, label) {
  const start = Date.now();

  const timeoutPromise = new Promise((_, reject) => {
    if (timeoutMs > 0) {
      setTimeout(() => {
        const elapsed = Date.now() - start;
        reject(new Error(`Timeout ${label} après ${elapsed}ms`));
      }, timeoutMs);
    }
  });

  try {
    const result = await (timeoutMs > 0
      ? Promise.race([taskFn(), timeoutPromise])
      : taskFn());

    return result;
  } catch (err) {
    console.error(`[pdfQueue] Erreur sur ${label}:`, err?.message || err);
    throw err;
  } finally {
    const elapsed = Date.now() - start;
    if (elapsed > Math.max(2000, timeoutMs * 0.8)) {
      console.warn(`[pdfQueue] ${label} terminé en ${elapsed}ms`);
    }
  }
}

/**
 * Expose l'état pour debug/monitoring léger.
 */
export function getQueueStats() {
  return {
    active: activeCount,
    pending: queue.length,
    concurrency: config.concurrency,
    defaultTimeoutMs: config.defaultTimeoutMs,
    maxQueueSize: config.maxQueueSize,
  };
}
