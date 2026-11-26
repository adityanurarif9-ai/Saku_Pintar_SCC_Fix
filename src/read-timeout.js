// Bound reads so a stalled connection cannot leave the loading screen open.
// Mutations keep their completion flow because their outcome can be uncertain.
export async function readWithTimeout(read, timeoutMs = 15000) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      const error = new Error('Pemuatan data terlalu lama. Periksa koneksi lalu coba lagi.');
      error.code = 'READ_TIMEOUT';
      reject(error);
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve().then(() => read(controller.signal)), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
