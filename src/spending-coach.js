import { jakartaMonth, transactionMonth } from './history-utils.js';

export const motivationMessages = {
  empty: [
    'Mulai dari satu catatan kecil. Kebiasaan rapi tumbuh dari hal sederhana.',
    'Kenali dulu ke mana uangmu pergi. Catatan pertama adalah langkah yang bagus.',
    'Tidak perlu langsung sempurna. Cukup luangkan sebentar untuk mencatat hari ini.',
    'Uang saku sedikit pun layak direncanakan. Mulai dengan apa yang kamu punya.',
    'Catatan yang jujur lebih berguna daripada angka yang terlihat bagus.',
  ],
  incomplete: [
    'Lengkapi catatan pemasukan agar kamu bisa melihat gambaran uangmu dengan lebih jelas.',
    'Jangan buru-buru menilai diri sendiri. Pastikan semua sumber uang sudah dicatat.',
    'Mencatat pengeluaran sudah langkah bagus. Berikutnya, lengkapi uang yang kamu terima.',
    'Uang dari hari atau bulan sebelumnya juga punya cerita. Periksa kembali catatanmu.',
    'Buat batas belanja yang sesuai kebutuhanmu, lalu pantau sedikit demi sedikit.',
  ],
  start: [
    'Sebelum mulai belanja, tentukan bagian untuk kebutuhan dan bagian untuk tabungan.',
    'Uang saku baru, kesempatan baru untuk membuat rencana yang lebih rapi.',
    'Sisihkan sedikit untuk tujuanmu jika memungkinkan. Kebiasaan kecil bisa berarti besar.',
    'Beri nama tujuan tabunganmu agar setiap rupiah yang disisihkan punya arah.',
    'Catat juga pembelian kecil nanti. Yang kecil sering mudah terlupakan.',
  ],
  steady: [
    'Kamu sudah menyisakan ruang dari pemasukan yang tercatat. Jaga kebiasaan ini sambil memenuhi kebutuhanmu.',
    'Hemat bukan berarti mengabaikan kebutuhan. Pilih belanja yang memang penting bagimu.',
    'Kemajuan kecil tetap kemajuan. Catatanmu membantu melihat hasil kebiasaan baik.',
    'Kalau masih memungkinkan, arahkan sebagian sisa uang ke target tabunganmu.',
    'Terus catat dengan jujur. Kebiasaan teratur lebih berharga daripada satu hari yang sempurna.',
    'Rencana yang bisa dijalankan lebih baik daripada target besar yang membuatmu tertekan.',
  ],
  budget: [
    'Belanja yang terencana memberi ruang untuk kebutuhan berikutnya. Terus pantau batasmu.',
    'Anggaranmu masih punya ruang. Periksa kebutuhan mendatang sebelum menambah belanja.',
    'Tetap catat pengeluaran kecil agar rencanamu tidak meleset tanpa terasa.',
    'Kamu tidak harus membeli semuanya hari ini. Beri ruang untuk rencana besok.',
    'Sesuaikan batas belanja dengan kebutuhan nyata, bukan sekadar angka yang terlihat aman.',
  ],
  watch: [
    'Berhenti sebentar sebelum membeli. Tanyakan: perlu sekarang atau bisa menunggu?',
    'Masih ada kesempatan merapikan rencana. Pilih satu pengeluaran yang bisa dikurangi.',
    'Bandingkan kebutuhan dengan keinginanmu sebelum belanja berikutnya.',
    'Coba siapkan bekal atau rencanakan perjalanan jika itu cocok dengan kebutuhanmu.',
    'Tidak perlu menyalahkan diri sendiri. Gunakan catatan ini untuk menentukan langkah selanjutnya.',
    'Satu keputusan belanja yang lebih terencana hari ini sudah menjadi langkah baik.',
  ],
  over: [
    'Batas terlewati bukan akhir dari rencana. Tinjau kebutuhan utama dan susun langkah kecil berikutnya.',
    'Lihat pengeluaran terbesar dulu. Cari bagian yang bisa disesuaikan tanpa mengabaikan kebutuhan penting.',
    'Bulan ini memberi pelajaran. Gunakan catatanmu untuk membuat batas yang lebih realistis.',
    'Jangan menghukum diri sendiri. Bedakan kebutuhan mendesak dengan belanja yang bisa ditunda.',
    'Mulai lagi dari keputusan berikutnya. Kebiasaan baik tidak harus menunggu bulan baru.',
    'Jika ada kebutuhan penting yang membuat anggaran terlewati, evaluasi rencananya dengan tenang.',
  ],
};

export function spendingInsight(activities, limit = 0, now = new Date()) {
  const month = jakartaMonth(now);
  const rows = activities.filter(row => transactionMonth(row.date) === month);
  const sum = kind => rows.filter(row => row.kind === kind).reduce((value, row) => value + row.amount, 0);
  const income = sum('income'), expense = sum('expense'), transfer = sum('transfer');
  const hasBudget = Number.isSafeInteger(limit) && limit > 0;
  const incomeRatio = income > 0 ? expense / income : null;
  const budgetRatio = hasBudget ? expense / limit : null;
  let state, title, explanation;
  if (!income && !expense) {
    state = 'empty'; title = 'Yuk, mulai mencatat'; explanation = 'Belum ada pemasukan atau pengeluaran yang tercatat bulan ini.';
  } else if (!expense) {
    state = 'start'; title = 'Awal yang baik'; explanation = 'Pemasukan sudah tercatat. Penilaian hemat muncul setelah ada pengeluaran yang bisa dibandingkan.';
  } else if (hasBudget && expense > limit) {
    state = 'over'; title = 'Melewati anggaran'; explanation = 'Pengeluaran bulan ini sudah melebihi batas belanja yang kamu tentukan.';
  } else if (hasBudget && expense / limit >= .8) {
    state = 'watch'; title = 'Perlu dijaga'; explanation = 'Sedikitnya 80% anggaran bulananmu sudah terpakai. Tinjau belanja berikutnya.';
  } else if (income > 0 && expense > income) {
    state = 'watch'; title = 'Perlu dijaga'; explanation = 'Pengeluaran melebihi pemasukan yang tercatat bulan ini. Bisa jadi ada saldo bulan lalu; periksa catatan dan kebutuhanmu.';
  } else if (income > 0 && expense / income <= .7) {
    state = 'steady'; title = 'Cenderung hemat'; explanation = 'Pengeluaranmu paling banyak 70% dari pemasukan bulan ini, dan belum mendekati batas anggaran jika diatur.';
  } else if (hasBudget) {
    state = 'budget'; title = 'Masih dalam anggaran'; explanation = 'Pengeluaran masih di bawah 80% batas belanja bulanan yang kamu tentukan.';
  } else if (income > 0) {
    state = 'watch'; title = 'Perlu dijaga'; explanation = 'Lebih dari 70% pemasukan bulan ini sudah dipakai untuk pengeluaran.';
  } else {
    state = 'incomplete'; title = 'Belum cukup data'; explanation = 'Pengeluaran sudah tercatat, tetapi pemasukan dan batas belanja belum tersedia sebagai pembanding.';
  }
  const signature = rows.map(row => `${row.id || ''}:${row.kind}:${row.amount}:${row.date}`).sort().join('|');
  return { state, title, explanation, income, expense, transfer, month, incomeRatio, budgetRatio, signature };
}

export function motivationFor(insight, userId = '', offset = 0) {
  const messages = motivationMessages[insight.state] || motivationMessages.empty;
  const key = `${userId}|${insight.month}|${insight.state}|${insight.signature}`;
  let hash = 2166136261;
  for (let index = 0; index < key.length; index++) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619) >>> 0;
  return messages[(hash % messages.length + (Math.max(0, Math.trunc(offset) || 0) % messages.length)) % messages.length];
}
