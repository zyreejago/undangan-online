# Undangan Online: Sekar & Bagas

Contoh undangan pernikahan digital satu halaman dengan tema Jawa bernuansa umber (cokelat tanah), dibuat sebagai karya orisinal dengan pendekatan ATM (amati, tiru, modifikasi) dari format undangan digital pada umumnya.

## Isi halaman

- **Cover** dengan ornamen gunungan SVG, nama mempelai, tanggal, nama tamu undangan, dan tombol Buka Undangan
- **Hitung mundur** menuju hari acara dan tombol Simpan Tanggal (Google Calendar)
- **Ayat suci** Q.S. Ar-Rum 21
- **Profil kedua mempelai** beserta nama orang tua
- **Rangkaian acara**: Akad Nikah dan Resepsi, lengkap dengan tautan Google Maps
- **Kisah Kami**: linimasa pertemuan sampai hari pernikahan
- **Galeri Momen** (panel ilustrasi, siap diganti foto asli)
- **Amplop Digital**: nomor rekening dan alamat kirim hadiah dengan tombol salin
- **RSVP dan Ucapan**: formulir konfirmasi kehadiran dan doa, tersimpan di localStorage peramban
- **Musik latar** petikan pentatonis lembut yang dibangkitkan WebAudio, dengan tombol nyala/mati

## Personalisasi nama tamu

Nama tamu dibaca dari parameter URL `to`, contoh:

```
index.html?to=Bapak+Joko+Prasetyo
```

Tanpa parameter, tampil teks bawaan "Nama Tamu".

## Menjalankan

Cukup buka `index.html` di peramban, atau sajikan sebagai situs statis (misalnya GitHub Pages dari branch `main`). Tidak ada proses build dan tidak ada dependensi selain Google Fonts.

## Catatan

Seluruh nama, tanggal, alamat, dan nomor rekening dalam contoh ini bersifat fiktif untuk keperluan demo. Ikon dan ornamen digambar sendiri dengan SVG dan CSS, tanpa memakai aset pihak ketiga.
