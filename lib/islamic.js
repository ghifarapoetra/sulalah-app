// ============================================
// Konten Islami Sulalah — Hadits Shahih
// ============================================

// Doa & hadits untuk yang sudah wafat
export const AMAL_JARIYAH = {
  hadith_utama: {
    arabic: 'إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ: إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ',
    terjemah: 'Apabila manusia meninggal dunia, terputuslah amalnya kecuali tiga perkara: sedekah jariyah, ilmu yang bermanfaat, atau anak shaleh yang mendoakannya.',
    sumber: 'HR. Muslim no. 1631'
  },
  hadith_doa: {
    arabic: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ',
    terjemah: 'Ya Allah, ampunilah dia, rahmatilah dia, sehatkan dia (dari siksa), dan maafkanlah dia.',
    sumber: 'HR. Muslim no. 963 — doa dalam shalat jenazah'
  },
  hadith_sedekah: {
    arabic: 'إِنَّ مِمَّا يَلْحَقُ الْمُؤْمِنَ مِنْ عَمَلِهِ وَحَسَنَاتِهِ بَعْدَ مَوْتِهِ عِلْمًا عَلَّمَهُ وَنَشَرَهُ، وَوَلَدًا صَالِحًا تَرَكَهُ، وَمُصْحَفًا وَرَّثَهُ، أَوْ مَسْجِدًا بَنَاهُ، أَوْ بَيْتًا لاِبْنِ السَّبِيلِ بَنَاهُ، أَوْ نَهْرًا أَجْرَاهُ، أَوْ صَدَقَةً أَخْرَجَهَا مِنْ مَالِهِ فِي صِحَّتِهِ وَحَيَاتِهِ',
    terjemah: 'Di antara amalan dan kebaikan yang terus menyertai mukmin setelah wafatnya: ilmu yang ia ajarkan dan sebarkan, anak shaleh yang ia tinggalkan, mushaf yang ia wariskan, masjid yang ia bangun, rumah untuk musafir, sungai yang ia alirkan, atau sedekah yang ia keluarkan dari hartanya semasa sehat dan hidup.',
    sumber: 'HR. Ibnu Majah no. 242, dishahihkan Al-Albani'
  },
  hadith_umroh: {
    arabic: 'الْعُمْرَةُ إِلَى الْعُمْرَةِ كَفَّارَةٌ لِمَا بَيْنَهُمَا',
    terjemah: 'Umrah ke umrah berikutnya adalah kaffarah (penghapus dosa) untuk apa yang terjadi di antara keduanya.',
    sumber: 'HR. Bukhari no. 1773, Muslim no. 1349'
  },
  hadith_badal: {
    arabic: 'حُجَّ عَنْ أَبِيكَ وَاعْتَمِرْ',
    terjemah: 'Hajilah atas nama ayahmu dan berumrahlah.',
    sumber: 'HR. Abu Dawud no. 1811, Tirmidzi no. 930 — shahih'
  }
}

// Pesan notifikasi milad islami
export function getMiladMessage(name, age) {
  const msgs = [
    {
      title: `${name} hari ini genap ${age} tahun`,
      body: `Satu tahun telah berlalu dari jatah usianya. Doakan ia diberi umur yang berkah, husnul khotimah, dan selalu dalam lindungan Allah ﷻ. Jangan lewatkan untuk menyambung silaturahim hari ini.`,
      hadith: 'مَنْ سَرَّهُ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ وَيُنْسَأَ لَهُ فِي أَثَرِهِ فَلْيَصِلْ رَحِمَهُ',
      hadith_id: 'Barang siapa yang ingin diluaskan rezekinya dan dipanjangkan umurnya, hendaklah ia menyambung tali silaturahim. (HR. Bukhari no. 5985)'
    },
    {
      title: `Hari ini milad ${name} — ${age} tahun`,
      body: `Al-Quran mengingatkan: "Dan Dia-lah yang menghidupkan dan mematikan, dan Dia-lah yang mengatur pergantian malam dan siang." Doakan ${name} diberi kesempatan bertaubat dan beramal shaleh di sisa umurnya.`,
      hadith: 'أَكْثِرُوا مِنْ ذِكْرِ هَاذِمِ اللَّذَّاتِ',
      hadith_id: 'Perbanyaklah mengingat pemutus kelezatan (kematian). (HR. Tirmidzi no. 2307, shahih)'
    },
    {
      title: `${name} bertambah satu tahun hari ini`,
      body: `Setiap tahun yang berlalu adalah nikmat sekaligus ujian. Semoga ${name} menjadi pribadi yang semakin dekat kepada Allah. Hubungi dan doakan ia hari ini — silaturahim adalah ibadah.`,
      hadith: 'خَيْرُ النَّاسِ أَطْوَلُهُمْ عُمُرًا وَأَحْسَنُهُمْ عَمَلًا',
      hadith_id: 'Sebaik-baik manusia adalah yang paling panjang umurnya dan paling baik amalnya. (HR. Tirmidzi no. 2329, shahih)'
    }
  ]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

// Reminder amalan untuk yang sudah wafat
export const AMALAN_WAFAT = [
  {
    icon: '🤲',
    title: 'Doakan',
    desc: 'Bacakan Al-Fatihah dan doa maghfirah untuknya',
    doa: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ',
    doa_id: 'Ya Allah, ampunilah dia, rahmatilah dia, sehatkan dia, dan maafkanlah dia.',
    sumber: 'HR. Muslim no. 963'
  },
  {
    icon: '💝',
    title: 'Sedekah Jariyah',
    desc: 'Sedekah atas namanya — pahalanya sampai meski sudah wafat',
    doa: null,
    sumber: 'HR. Muslim no. 1631'
  },
  {
    icon: '🕌',
    title: 'Badal Umroh',
    desc: 'Umroh atas namanya — diperbolehkan dalam syariat Islam',
    doa: null,
    sumber: 'HR. Abu Dawud no. 1811, shahih'
  },
  {
    icon: '📖',
    title: 'Tilawah & Hadiahkan',
    desc: 'Bacakan Al-Quran dan hadiahkan pahalanya',
    doa: null,
    sumber: 'Pendapat jumhur ulama'
  }
]
