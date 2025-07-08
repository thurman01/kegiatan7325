const bidangOptions = ["UMUM", "IPDS", "SOSIAL", "DISTRIBUSI", "NERACA", "PRODUKSI", "LAINNYA"];
const namaPegawaiOptions = [ // Array untuk nama pegawai
  "nama1", "nama2", "nama3", "nama4", "nama5", "nama6", "nama7", "nama8", "nama9", "nama10",
  "nama11", "nama12", "nama13", "nama14", "nama15", "nama16", "nama17", "nama18", "nama19", "nama20",
  "nama21", "nama22", "nama23", "nama24", "nama25", "nama26", "nama27", "nama28", "nama29", "nama30",
  "nama31", "nama32", "nama33", "nama34", "nama35", "nama36"
];
let usernameGlobal = "";
let base64ImageGlobal = ""; // hasil foto yg sudah ditempel teks

window.onload = () => {
  renderBidangOptions();
  renderNamaPegawaiOptions(); // Panggil fungsi untuk mengisi dropdown nama pegawai
  if (localStorage.getItem("stayLogin") === "true") {
    usernameGlobal = localStorage.getItem("username");
    showForm();
  }
};

function renderBidangOptions() {
  const group = document.getElementById("bidang-group");
  bidangOptions.forEach(val => {
    const radio = document.createElement("input");
    radio.type = "radio"; radio.name = "bidang"; radio.value = val;
    radio.onclick = () => {
      document.getElementById("bidang-lain").style.display = (val === "LAINNYA") ? "block" : "none";
    };
    group.appendChild(radio);
    group.appendChild(document.createTextNode(val));
    group.appendChild(document.createElement("br"));
  });
}

function renderNamaPegawaiOptions() { // Fungsi baru untuk mengisi dropdown nama pegawai
  const select = document.getElementById("nama-pegawai");
  namaPegawaiOptions.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

async function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const res = await fetch(`https://script.google.com/macros/s/AKfycbyiMChjTq54ovT7ID7lMZUHp_dOCBDl7DAwGWfF8h_UoT50qwwi20woon1ZU41HGMWotA/exec?mode=login&user=${user}&pass=${pass}`);
  const result = await res.json();
  if (result.success) {
    if (document.getElementById("staySignedIn").checked) {
      localStorage.setItem("stayLogin", "true");
      localStorage.setItem("username", user);
    }
    usernameGlobal = user;
    showForm();
  } else {
    alert("Login gagal");
  }
}

function showForm() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("form-screen").style.display = "block";
  document.getElementById("time-display").textContent = `Waktu sekarang: ${new Date().toLocaleString()}`;
}

function ambilFoto() {
  document.getElementById("input-foto").click();
}

document.getElementById("input-foto").addEventListener("change", function () {
  const file = this.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      navigator.geolocation.getCurrentPosition(pos => {
        const canvas = document.getElementById("canvas-foto");
        const ctx = canvas.getContext("2d");
        
        // Atur ukuran canvas sesuai dengan gambar
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);

        // Hitung ukuran font berdasarkan lebar gambar (5% dari lebar gambar)
        const fontSize = Math.floor(img.width * 0.05); 
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = "white";
        ctx.shadowColor = "black"; // Tambahkan bayangan untuk keterbacaan
        ctx.shadowBlur = 5; // Efek blur bayangan

        const lokasi = `Lokasi: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        const waktu = `Waktu: ${new Date().toLocaleString()}`;
        const namaPegawaiTerpilih = document.getElementById("nama-pegawai").value; // Ambil nama pegawai
        const namaPegawaiText = `Nama Pegawai: ${namaPegawaiTerpilih}`; // Teks nama pegawai

        // Sesuaikan posisi teks
        ctx.fillText(namaPegawaiText, 10, fontSize + 5); // Tampilkan nama pegawai
        ctx.fillText(lokasi, 10, (fontSize * 2) + 10);
        ctx.fillText(waktu, 10, (fontSize * 3) + 15);

        // simpan base64 yang sudah di-render ke canvas
        base64ImageGlobal = canvas.toDataURL("image/jpeg");
        document.getElementById("reset-foto-button").style.display = "block"; // Tampilkan tombol reset
      }, err => {
        alert("Gagal mendapatkan lokasi.");
        document.getElementById("reset-foto-button").style.display = "none"; // Sembunyikan tombol reset jika gagal
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

function resetFoto() { // Fungsi untuk mereset foto
  const canvas = document.getElementById("canvas-foto");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Bersihkan canvas
  base64ImageGlobal = ""; // Kosongkan base64 gambar
  document.getElementById("input-foto").value = ""; // Hapus file yang dipilih di input
  document.getElementById("reset-foto-button").style.display = "none"; // Sembunyikan tombol reset
}

async function submitForm() {
  const namaPegawai = document.getElementById("nama-pegawai").value; // Ambil nilai nama pegawai
  const kegiatan = document.getElementById("kegiatan").value;
  const bidangRadio = document.querySelector("input[name='bidang']:checked");
  
  if (!namaPegawai) return alert("Pilih nama pegawai!"); // Validasi nama pegawai
  if (!bidangRadio) return alert("Pilih bidang pekerjaan!");

  const bidang = bidangRadio.value === "LAINNYA"
    ? document.getElementById("bidang-lain").value
    : bidangRadio.value;

  if (!base64ImageGlobal) {
    alert("Ambil foto dulu sebelum submit.");
    return;
  }

  document.getElementById("loading-overlay").style.display = "flex"; // Tampilkan loading overlay

  const waktu = new Date().toLocaleString();
  const filename = `${usernameGlobal}_${Date.now()}.jpg`;

  try {
    const upload = await fetch("https://script.google.com/macros/s/AKfycbyiMChjTq54ovT7ID7lMZUHp_dOCBDl7DAwGWfF8h_UoT50qwwi20woon1ZU41HGMWotA/exec", {
      method: "POST",
      body: JSON.stringify({
        mode: "upload",
        user: usernameGlobal,
        namaPegawai: namaPegawai, // Kirim nama pegawai
        kegiatan,
        bidang,
        waktu,
        filename,
        foto: base64ImageGlobal
      }),
    });

    const hasil = await upload.json();
    document.getElementById("loading-overlay").style.display = "none"; // Sembunyikan loading overlay

    if (hasil.success) {
      alert("Data berhasil dikirim!");
      // Reset form setelah berhasil submit (opsional)
      document.getElementById("kegiatan").value = "";
      document.getElementById("bidang-lain").value = "";
      // Loop melalui radio button dan atur checked ke false
      const radioButtons = document.querySelectorAll("input[name='bidang']");
      radioButtons.forEach(radio => {
        radio.checked = false;
      });
      document.getElementById("nama-pegawai").selectedIndex = 0; // Reset dropdown nama pegawai
      resetFoto();
    } else {
      alert("Gagal mengirim data.");
    }
  } catch (error) {
    document.getElementById("loading-overlay").style.display = "none"; // Sembunyikan loading overlay jika ada error
    alert("Terjadi kesalahan saat mengirim data: " + error.message);
  }
}
