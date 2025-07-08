const bidangOptions = ["UMUM", "IPDS", "SOSIAL", "DISTRIBUSI", "NERACA", "PRODUKSI", "LAINNYA"];
let usernameGlobal = "";
let base64ImageGlobal = ""; // hasil foto yg sudah ditempel teks

window.onload = () => {
  renderBidangOptions();
  renderNamaPegawaiOptions();
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

function renderNamaPegawaiOptions() {
  const select = document.getElementById("nama-pegawai");
  for (let i = 1; i <= 36; i++) {
    const option = document.createElement("option");
    option.value = `nama${i}`;
    option.textContent = `nama${i}`;
    select.appendChild(option);
  }
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
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const fontSize = Math.floor(img.width * 0.05);
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = "white";

        const lokasi = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        const waktu = new Date().toLocaleString();

        ctx.fillText(`Lokasi: ${lokasi}`, 10, 30);
        ctx.fillText(`Waktu: ${waktu}`, 10, 30 + fontSize + 10);

        base64ImageGlobal = canvas.toDataURL("image/jpeg");
      }, err => {
        alert("Gagal mendapatkan lokasi.");
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

function resetFoto() {
  base64ImageGlobal = "";
  const canvas = document.getElementById("canvas-foto");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("input-foto").value = "";
}

async function submitForm() {
  const kegiatan = document.getElementById("kegiatan").value;
  const nama = document.getElementById("nama-pegawai").value;
  const bidangRadio = document.querySelector("input[name='bidang']:checked");
  const loadingPopup = document.getElementById("loading-popup");

  if (!nama) return alert("Pilih nama pegawai!");
  if (!bidangRadio) return alert("Pilih bidang pekerjaan!");
  if (!base64ImageGlobal) return alert("Ambil foto dulu sebelum submit.");

  const bidang = bidangRadio.value === "LAINNYA"
    ? document.getElementById("bidang-lain").value
    : bidangRadio.value;

  const waktu = new Date().toLocaleString();
  const filename = `${usernameGlobal}_${Date.now()}.jpg`;

  loadingPopup.style.display = "block";

  try {
    const upload = await fetch("https://script.google.com/macros/s/AKfycbyiMChjTq54ovT7ID7lMZUHp_dOCBDl7DAwGWfF8h_UoT50qwwi20woon1ZU41HGMWotA/exec", {
      method: "POST",
      body: JSON.stringify({
        mode: "upload",
        user: usernameGlobal,
        nama,
        kegiatan,
        bidang,
        waktu,
        filename,
        foto: base64ImageGlobal
      }),
    });

    const hasil = await upload.json();
    loadingPopup.style.display = "none";

    if (hasil.success) {
      alert("✅ Data berhasil dikirim!");
    } else {
      alert("❌ Gagal mengirim data.");
    }
  } catch (err) {
    loadingPopup.style.display = "none";
    alert("❌ Terjadi kesalahan saat mengirim data.");
  }
}
