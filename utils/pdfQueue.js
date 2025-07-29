// 📁 utils/pdfQueue.js
const queue = [];
let processing = false;

export async function enqueuePDF(taskFn) {
  return new Promise((resolve, reject) => {
    queue.push({ taskFn, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (processing || queue.length === 0) return;

  processing = true;
  const { taskFn, resolve, reject } = queue.shift();

  try {
    const result = await taskFn();
    resolve(result);
  } catch (err) {
    reject(err);
  } finally {
    processing = false;
    processQueue();
  }
}
