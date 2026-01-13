
# Panduan Integrasi Google Spreadsheet & Apps Script

Untuk menghubungkan aplikasi ini dengan Spreadsheet Anda, ikuti langkah-langkah berikut:

## 1. Persiapan Spreadsheet

Buat Google Spreadsheet baru, lalu buat **3 Tab (Sheet)** dengan nama persis seperti di bawah ini:

### Tab 1: `Data_Ijin`
Gunakan baris pertama sebagai Header. **Perhatikan urutan kolom baru:**
*   **Kolom A:** ID
*   **Kolom B:** Nama
*   **Kolom C:** NIP
*   **Kolom D:** Pangkat
*   **Kolom E:** Jabatan
*   **Kolom F:** Unit Kerja
*   **Kolom G:** Jenis Ijin
*   **Kolom H:** Alasan
*   **Kolom I:** Tgl Mulai
*   **Kolom J:** Jam Mulai
*   **Kolom K:** Tgl Selesai
*   **Kolom L:** Jam Selesai
*   **Kolom M:** Status
*   **Kolom N:** Tgl Pengajuan

### Tab 2: `Data_Pegawai`
Header:
*   **Kolom A:** Nama
*   **Kolom B:** NIP
*   **Kolom C:** Jabatan
*   **Kolom D:** Pangkat

### Tab 3: `Login`
Header:
*   **Kolom A:** NIP
*   **Kolom B:** Nama
*   **Kolom C:** Role
*   **Kolom D:** Username
*   **Kolom E:** Password

---

## 2. Persiapan Template Surat (Google Docs)

Agar tombol **"Unduh Doc"** berfungsi, Anda harus membuat Template Surat Ijin di Google Docs.

1.  Buat file Google Doc baru di Google Drive Anda.
2.  Desain surat sesuai kop surat sekolah Anda.
3.  Gunakan **Kata Kunci (Variables)** berikut di dalam dokumen, nanti akan otomatis diganti oleh sistem:

    *   `{{NAMA}}` : Nama Pegawai
    *   `{{NIP}}` : NIP Pegawai
    *   `{{PANGKAT}}` : Pangkat / Golongan
    *   `{{JABATAN}}` : Jabatan
    *   `{{UNIT_KERJA}}` : Unit Kerja (Sekolah)
    *   `{{JENIS_IJIN}}` : Jenis Ijin / Cuti
    *   `{{ALASAN}}` : Alasan Ijin
    *   `{{TANGGAL_MULAI}}` : Tanggal Mulai (Format Indo)
    *   `{{TANGGAL_SELESAI}}` : Tanggal Selesai (Format Indo)
    *   `{{JAM_MULAI}}` : Jam Mulai
    *   `{{JAM_SELESAI}}` : Jam Selesai
    *   `{{TANGGAL_SURAT}}` : Tanggal Hari Ini

4.  Simpan file Doc tersebut.
5.  Salin **ID Dokumen** dari URL di address bar browser.
    *   Contoh URL: `docs.google.com/document/d/1abc12345xyz/edit`
    *   ID-nya adalah: `1abc12345xyz`
6.  Paste ID tersebut ke dalam variabel `TEMPLATE_ID` di kode Apps Script di bawah.

---

## 3. Pasang Kode Backend (Apps Script)

1.  Di Spreadsheet, klik menu **Ekstensi (Extensions)** > **Apps Script**.
2.  Hapus semua kode yang ada di file `Code.gs`.
3.  Copy kode di bawah ini dan Paste ke editor tersebut.
4.  **PENTING:** Ganti `ID_TEMPLATE_DOC_ANDA_DISINI` dengan ID Template Google Doc yang sudah Anda buat tadi.
5.  Klik icon **Save** (Disket).

```javascript
// ==========================================
// KONFIGURASI NAMA SHEET
// ==========================================
var SHEET_IJIN = "Data_Ijin";
var SHEET_PEGAWAI = "Data_Pegawai";
var SHEET_LOGIN = "Login";

// (WAJIB) GANTI DENGAN ID GOOGLE DOC TEMPLATE ANDA UNTUK FITUR DOC
// Contoh: "1abc12345xyz..."
var TEMPLATE_ID = "ID_TEMPLATE_DOC_ANDA_DISINI"; 

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Safety check jika JSON invalid
    if (!e || !e.postData || !e.postData.contents) {
       return responseJSON({ status: 'error', message: 'No post data' });
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    // ------------------------------------------------------------------
    // 1. ACTION: CREATE (Simpan Ijin ke Data_Ijin)
    // ------------------------------------------------------------------
    if (action === 'create') {
      var sheet = getOrInsertSheet(ss, SHEET_IJIN);
      // Urutan Array sesuai Header Spreadsheet:
      // A(ID), B(Nama), C(NIP), D(Pangkat), E(Jabatan), F(Unit), G(Tipe), H(Alasan)...
      sheet.appendRow([
        data.id,
        data.nama,
        "'"+data.nip,
        data.pangkat || "-", // Kolom D
        data.jabatan,        // Kolom E
        data.unit || "-",
        data.tipe,
        data.alasan,
        data.mulai,
        data.jamMulai,
        data.selesai,
        data.jamSelesai,
        data.status,
        data.tanggalPengajuan || new Date().toISOString()
      ]);
      return responseJSON({ status: 'success', message: 'Data saved' });
    }

    // ------------------------------------------------------------------
    // 2. ACTION: UPDATE STATUS (Approve/Reject di Data_Ijin)
    // ------------------------------------------------------------------
    else if (action === 'update_status') {
      var sheet = getOrInsertSheet(ss, SHEET_IJIN);
      var rows = sheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.id) {
          // Status sekarang ada di Kolom M (urutan ke-13)
          sheet.getRange(i + 1, 13).setValue(data.status); 
          found = true;
          break;
        }
      }
      return responseJSON({ status: found ? 'success' : 'not_found' });
    }

    // ------------------------------------------------------------------
    // 3. ACTION: DELETE (Hapus dari Data_Ijin)
    // ------------------------------------------------------------------
    else if (action === 'delete') {
      var sheet = getOrInsertSheet(ss, SHEET_IJIN);
      var rows = sheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.id) {
          sheet.deleteRow(i + 1);
          found = true;
          break;
        }
      }
      return responseJSON({ status: found ? 'success' : 'not_found' });
    }

    // ------------------------------------------------------------------
    // 4. ACTION: GET REQUESTS (Ambil dari Data_Ijin)
    // ------------------------------------------------------------------
    else if (action === 'get_requests') {
      var sheet = getOrInsertSheet(ss, SHEET_IJIN);
      var rows = sheet.getDataRange().getValues();
      var result = [];
      for (var i = 1; i < rows.length; i++) {
        // Mapping sesuai urutan kolom baru
        result.push({
          id: rows[i][0],
          name: rows[i][1],
          nip: String(rows[i][2]),
          rank: rows[i][3],       // Kolom D (Pangkat)
          position: rows[i][4],   // Kolom E (Jabatan)
          department: rows[i][5], // Kolom F
          type: rows[i][6],
          reason: rows[i][7],
          startDate: rows[i][8],
          startTime: rows[i][9],
          endDate: rows[i][10],
          endTime: rows[i][11],
          status: rows[i][12],    // Kolom M
          createdAt: rows[i][13]  // Kolom N
        });
      }
      result.reverse(); 
      return responseJSON({ status: 'success', data: result });
    }

    // ------------------------------------------------------------------
    // 5. ACTION: SYNC USERS (Split data ke 'Data_Pegawai' dan 'Login')
    // ------------------------------------------------------------------
    else if (action === 'sync_users') {
      var sheetPegawai = getOrInsertSheet(ss, SHEET_PEGAWAI);
      var sheetLogin = getOrInsertSheet(ss, SHEET_LOGIN);
      
      // Clear konten lama (sisakan header baris 1)
      if (sheetPegawai.getLastRow() > 1) sheetPegawai.getRange(2, 1, sheetPegawai.getLastRow()-1, 4).clearContent();
      if (sheetLogin.getLastRow() > 1) sheetLogin.getRange(2, 1, sheetLogin.getLastRow()-1, 5).clearContent();

      var users = data.users;
      var rowsPegawai = [];
      var rowsLogin = [];

      for (var j = 0; j < users.length; j++) {
        // Data Pegawai: Nama, NIP, Jabatan, Pangkat
        rowsPegawai.push([
          users[j].name,
          "'"+users[j].nip,
          users[j].position,
          users[j].rank || "-"
        ]);

        // Data Login: NIP, Nama, Role, Username(D), Password(E)
        rowsLogin.push([
          "'"+users[j].nip,
          users[j].name,
          users[j].role,
          users[j].username || "", // Kolom D
          users[j].password || ""  // Kolom E
        ]);
      }

      if (rowsPegawai.length > 0) sheetPegawai.getRange(2, 1, rowsPegawai.length, 4).setValues(rowsPegawai);
      if (rowsLogin.length > 0) sheetLogin.getRange(2, 1, rowsLogin.length, 5).setValues(rowsLogin);

      return responseJSON({ status: 'success' });
    }

    // ------------------------------------------------------------------
    // 6. ACTION: GET USERS (GABUNGKAN 'Data_Pegawai' + 'Login')
    // ------------------------------------------------------------------
    else if (action === 'get_users') {
      var sheetPegawai = getOrInsertSheet(ss, SHEET_PEGAWAI);
      var sheetLogin = getOrInsertSheet(ss, SHEET_LOGIN);

      var dataPegawai = sheetPegawai.getDataRange().getValues(); // [Nama, NIP, Jabatan, Pangkat]
      var dataLogin = sheetLogin.getDataRange().getValues();     // [NIP, Nama, Role, Username, Password]

      var userMap = {};

      // 1. Baca Data Login (Auth)
      for (var i = 1; i < dataLogin.length; i++) {
        var nip = String(dataLogin[i][0]);
        if (!nip) continue;
        userMap[nip] = {
          nip: nip,
          name: dataLogin[i][1], // Fallback name
          role: dataLogin[i][2],
          username: dataLogin[i][3], // Kolom D
          password: String(dataLogin[i][4]) // Kolom E
        };
      }

      // 2. Perkaya dengan Data Pegawai (Profil)
      for (var j = 1; j < dataPegawai.length; j++) {
        var nipP = String(dataPegawai[j][1]); // NIP ada di kolom B
        if (userMap[nipP]) {
          userMap[nipP].name = dataPegawai[j][0]; // Update Nama dari data pegawai (lebih valid)
          userMap[nipP].position = dataPegawai[j][2];
          userMap[nipP].rank = dataPegawai[j][3]; // Kolom D
        } else {
          // Jika ada di Data Pegawai tapi belum ada di Login, buat entry baru (bisa login default)
          userMap[nipP] = {
             nip: nipP,
             name: dataPegawai[j][0],
             position: dataPegawai[j][2],
             rank: dataPegawai[j][3],
             role: 'GURU', // Default
             username: nipP, // Default Username = NIP
             password: nipP  // Default Pass = NIP
          };
        }
      }

      // Konversi Map ke Array
      var result = Object.keys(userMap).map(function(key) { return userMap[key]; });
      return responseJSON({ status: 'success', data: result });
    }

    // ------------------------------------------------------------------
    // 7. ACTION: DOWNLOAD DOC (WORD)
    // ------------------------------------------------------------------
    else if (action === 'download_doc') {
       if (!TEMPLATE_ID || TEMPLATE_ID.includes("ID_TEMPLATE")) {
         return responseJSON({ status: 'error', message: 'ERROR: Template ID belum disetting di Apps Script.' });
      }
      
      var templateFile;
      try {
        templateFile = DriveApp.getFileById(TEMPLATE_ID);
      } catch(e) {
         return responseJSON({ status: 'error', message: 'ERROR: File Template tidak ditemukan. Periksa ID: ' + TEMPLATE_ID });
      }

      var tempFile = templateFile.makeCopy("Temp_" + data.nama);
      var tempDoc = DocumentApp.openById(tempFile.getId());
      var body = tempDoc.getBody();
      
      var formatIndo = function(str) {
        if(!str) return "-";
        var d = new Date(str);
        if(isNaN(d.getTime())) return str;
        var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
      };

      // Replace Variables
      body.replaceText("{{NAMA}}", data.nama || "-");
      body.replaceText("{{NIP}}", data.nip || "-");
      body.replaceText("{{JABATAN}}", data.jabatan || "-");
      body.replaceText("{{PANGKAT}}", data.pangkat || "-"); 
      body.replaceText("{{UNIT_KERJA}}", data.unit || "-");
      body.replaceText("{{JENIS_IJIN}}", data.tipe || "-");
      body.replaceText("{{ALASAN}}", data.alasan || "-");
      body.replaceText("{{TANGGAL_MULAI}}", formatIndo(data.mulai));
      body.replaceText("{{TANGGAL_SELESAI}}", formatIndo(data.selesai));
      body.replaceText("{{JAM_MULAI}}", data.jamMulai || "");
      body.replaceText("{{JAM_SELESAI}}", data.jamSelesai || "");
      body.replaceText("{{TANGGAL_SURAT}}", formatIndo(new Date().toISOString()));

      // Save and Close is CRITICAL 
      tempDoc.saveAndClose();
      
      // Export to DOCX
      // Menggunakan UrlFetchApp untuk mengakses fitur export Drive
      var url = "https://docs.google.com/document/d/" + tempFile.getId() + "/export?format=docx";
      var token = ScriptApp.getOAuthToken();
      var response = UrlFetchApp.fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token
        },
        muteHttpExceptions: true
      });
      
      if (response.getResponseCode() !== 200) {
        return responseJSON({ status: 'error', message: 'Gagal convert ke DOCX. Response: ' + response.getContentText() });
      }

      var blob = response.getBlob();
      var base64Data = Utilities.base64Encode(blob.getBytes());
      
      // Delete Temp File
      tempFile.setTrashed(true);
      
      return responseJSON({ status: 'success', data: base64Data, filename: 'Surat_Ijin_' + (data.nama || 'Guru') + '.docx' });
    }

    return responseJSON({ status: 'error', message: 'Unknown action' });
  } catch (e) {
    var msg = "Unknown Error";
    if (e) {
       if (e.message) msg = e.message;
       else if (typeof e === 'string') msg = e;
       else {
         try {
            msg = JSON.stringify(e);
         } catch (err) {
            msg = "Complex Error Object (Unserializable)";
         }
       }
    }
    
    if (msg === '[object Object]' || typeof msg !== 'string') {
        msg = "Internal Script Error (Check Apps Script logs)";
    }
    
    return responseJSON({ status: 'error', message: msg });
  } finally {
    lock.releaseLock();
  }
}

function getOrInsertSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
```

## 4. Deployment (PENTING!)

Setiap kali Anda mengubah kode di Apps Script:

1.  Klik tombol **Terapkan (Deploy)** > **Kelola Penerapan (Manage deployments)**.
2.  Klik **Icon Pensil (Edit)** pada deployment yang aktif.
3.  Ubah **Versi** menjadi **Versi Baru (New version)**.
4.  Pastikan "Who has access" = **Anyone (Siapa saja)**.
5.  Klik **Terapkan (Deploy)**.

Jika Anda tidak membuat versi baru, perubahan kode tidak akan terbaca oleh aplikasi.
