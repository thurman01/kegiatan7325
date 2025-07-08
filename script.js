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

// ---- Fungsi untuk menggambar watermark teks ----
function drawTextWatermark(canvas, ctx, lines, startX, bottomPadding, fontSize, boxPadding) {
    let currentY = canvas.height - bottomPadding;
    // Calculate line height including vertical box padding and extra spacing between lines
    const lineHeight = fontSize + (2 * boxPadding) + 5; // 5px extra space between lines

    ctx.font = `${fontSize}px Arial`;
    ctx.shadowColor = "black";
    ctx.shadowBlur = 5;
    ctx.textBaseline = 'bottom'; // Ensure Y coordinate is the bottom of the text

    // Iterate lines in reverse to draw from bottom up
    for (let i = lines.length - 1; i >= 0; i--) {
        const lineText = lines[i];
        const textWidth = ctx.measureText(lineText).width;
        
        // Background rectangle for text
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; // Black with 60% opacity
        // rectX, rectY, rectWidth, rectHeight
        ctx.fillRect(startX - boxPadding, currentY - fontSize - boxPadding,
                     textWidth + (2 * boxPadding), fontSize + (2 * boxPadding));

        // Text itself
        ctx.fillStyle = "white";
        ctx.fillText(lineText, startX, currentY);

        currentY -= lineHeight; // Move up for next line
    }
}

// ---- Fungsi untuk memfinalisasi hasil gambar canvas ----
function finalizeCanvasDrawing(canvas) {
    base64ImageGlobal = canvas.toDataURL("image/jpeg");
    console.log("finalizeCanvasDrawing: base64ImageGlobal set, length:", base64ImageGlobal.length); // Debugging log
    document.getElementById("reset-foto-button").style.display = "block";
}


// ---- Fungsi untuk menggambar watermark utama dan minimap ----
function drawWatermarkAndMinimap(canvas, ctx, img, pos, namaPegawaiTerpilih) {
    // Atur ukuran canvas sesuai dengan gambar
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.drawImage(img, 0, 0); // Gambar foto utama

    const minSide = Math.min(img.width, img.height); // Sisi terpendek
    const fontSize = Math.floor(minSide * 0.05); // 5% dari sisi terpendek
    
    // Data untuk baris teks watermark
    const lines = [
        `Nama Pegawai: ${namaPegawaiTerpilih}`,
        pos ? `Lokasi: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` : 'Lokasi: Tidak tersedia',
        `Waktu: ${new Date().toLocaleString()}`
    ];

    const bottomPadding = 15; // Jarak dari bawah canvas
    const textMarginFromLeft = 10; // Jarak teks dari tepi kiri atau dari minimap
    const boxPadding = 5; // Padding di sekitar teks di dalam background

    let mapSize = 0;
    let textBlockStartX = textMarginFromLeft; // Posisi awal teks (default tanpa map)

    if (pos && pos.coords.latitude && pos.coords.longitude) { // Hanya coba gambar map jika geolocation tersedia
        mapSize = Math.floor(minSide * 0.15); // 15% dari sisi terpendek untuk minimap
        const mapX = textMarginFromLeft;
        const mapY = canvas.height - mapSize - bottomPadding;

        textBlockStartX = mapX + mapSize + textMarginFromLeft; // Geser teks ke kanan setelah map

        const mapImage = new Image();
        // API Key LocationIQ Anda
        const locationIqApiKey = "pk.ba1138b8c2be50e65f13934cf920a36f"; 
        mapImage.src = `https://maps.locationiq.com/v3/staticmap?key=${locationIqApiKey}&center=${pos.coords.latitude},${pos.coords.longitude}&zoom=16&size=${mapSize}x${mapSize}&markers=icon:small-red-circle|${pos.coords.latitude},${pos.coords.longitude}`;
        
        mapImage.onload = () => {
            ctx.drawImage(mapImage, mapX, mapY, mapSize, mapSize); // Gambar minimap
            drawTextWatermark(canvas, ctx, lines, textBlockStartX, bottomPadding, fontSize, boxPadding);
            finalizeCanvasDrawing(canvas); // Finalisasi setelah map dan teks tergambar
        };

        mapImage.onerror = () => {
            console.error("Failed to load minimap image. Drawing watermark without map.");
            // Gambar watermark teks dari tepi kiri tanpa minimap
            drawTextWatermark(canvas, ctx, lines, textMarginFromLeft, bottomPadding, fontSize, boxPadding); 
            finalizeCanvasDrawing(canvas); // Finalisasi meskipun map gagal
        };
    } else {
        // Jika geolocation tidak tersedia, gambar watermark teks dari tepi kiri tanpa minimap
        drawTextWatermark(canvas, ctx, lines, textMarginFromLeft, bottomPadding, fontSize, boxPadding);
        finalizeCanvasDrawing(canvas); // Finalisasi langsung
    }
}


document.getElementById("input-foto").addEventListener("change", function () {
  const file = this.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
        const canvas = document.getElementById("canvas-foto");
        const ctx = canvas.getContext("2d");
        const namaPegawaiTerpilih = document.getElementById("nama-pegawai").value;

      navigator.geolocation.getCurrentPosition(pos => {
          // Panggil fungsi utama untuk menggambar watermark dan minimap
          drawWatermarkAndMinimap(canvas, ctx, img, pos, namaPegawaiTerpilih);
      }, err => {
        alert("Gagal mendapatkan lokasi. Watermark akan ditampilkan tanpa informasi lokasi.");
        // Panggil fungsi utama dengan pos null jika geolocation gagal
        drawWatermarkAndMinimap(canvas, ctx, img, null, namaPegawaiTerpilih); 
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
  
  // Debugging log untuk melihat nilai base64ImageGlobal saat submit
  console.log("submitForm called, base64ImageGlobal length:", base64ImageGlobal.length);

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
