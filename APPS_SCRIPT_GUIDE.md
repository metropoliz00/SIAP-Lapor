
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
*   **Kolom O:** (Bisa kosong atau data lain)
*   **Kolom P:** **Merged Doc URL** (Link PDF hasil generate otomatis)

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

## 2. Persiapan Template & Folder Drive (Wajib)

1.  **Template Surat:**
    *   Buat file Google Doc baru.
    *   Isi dengan kata kunci: `{{NAMA}}`, `{{NIP}}`, `{{PANGKAT}}`, `{{JABATAN}}`, `{{UNIT_KERJA}}`, `{{JENIS_IJIN}}`, `{{ALASAN}}`, `{{TANGGAL_MULAI}}`, `{{TANGGAL_SELESAI}}`, `{{JAM_MULAI}}`, `{{JAM_SELESAI}}`, `{{TANGGAL_SURAT}}`.
    *   Salin **ID Template** dari URL.

2.  **Folder Penyimpanan PDF:**
    *   Buat Folder baru di Google Drive (misal: "Arsip Surat Ijin").
    *   Buka folder tersebut.
    *   Salin **ID Folder** dari URL browser (bagian acak setelah `folders/`).
    *   Pastikan folder memiliki akses **"Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view)** agar PDF bisa dibuka oleh guru.

---

## 3. Pasang Kode Backend (Apps Script)

1.  Di Spreadsheet, klik menu **Ekstensi (Extensions)** > **Apps Script**.
2.  Hapus semua kode yang ada di file `Code.gs`.
3.  Copy kode di bawah ini dan Paste ke editor tersebut.
4.  **PENTING:** Isi `TEMPLATE_ID` dan `FOLDER_ID` di bagian konfigurasi.
5.  Klik icon **Save** (Disket).

```javascript
// ==========================================
// KONFIGURASI
// ==========================================
var SHEET_IJIN = "Data_Ijin";
var SHEET_PEGAWAI = "Data_Pegawai";
var SHEET_LOGIN = "Login";

// [WAJIB] ID Template Google Doc
var TEMPLATE_ID = "MASUKKAN_ID_DOC_TEMPLATE_DISINI"; 

// [WAJIB] ID Folder Google Drive
var FOLDER_ID = "MASUKKAN_ID_FOLDER_DRIVE_DISINI";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!e || !e.postData || !e.postData.contents) {
       return responseJSON({ status: 'error', message: 'No post data' });
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    // ------------------------------------------------------------------
    // 1. ACTION: CREATE (Simpan Ijin Baru)
    // ------------------------------------------------------------------
    if (action === 'create') {
      var sheet = getOrInsertSheet(ss, SHEET_IJIN);
      sheet.appendRow([
        data.id,
        data.nama,
        "'"+data.nip,
        data.pangkat || "-", 
        data.jabatan,        
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
    // 2. ACTION: UPDATE_DATA (Edit Data)
    // ------------------------------------------------------------------
    else if (action === 'update_data') {
      var sheet = getOrInsertSheet(ss, SHEET_IJIN);
      var rows = sheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.id) {
          // Update Kolom B(2) s.d M(13)
          var range = sheet.getRange(i + 1, 2, 1, 12); 
          range.setValues([[
             data.nama, "'"+data.nip, data.pangkat || "-", data.jabatan,
             data.unit || "-", data.tipe, data.alasan,
             data.mulai, data.jamMulai, data.selesai, data.jamSelesai, data.status
          ]]);
          found = true;
          break;
        }
      }
      return responseJSON({ status: found ? 'success' : 'not_found' });
    }

    // ------------------------------------------------------------------
    // 3. ACTION: UPDATE STATUS (Approve/Reject)
    // ------------------------------------------------------------------
    else if (action === 'update_status') {
      var sheet = getOrInsertSheet(ss, SHEET_IJIN);
      var rows = sheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.id) {
          // Update Kolom M (13)
          sheet.getRange(i + 1, 13).setValue(data.status); 
          found = true;
          break;
        }
      }
      return responseJSON({ status: found ? 'success' : 'not_found' });
    }

    // ------------------------------------------------------------------
    // 4. ACTION: DELETE
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
    // 5. ACTION: GET REQUESTS (Data Ijin)
    // ------------------------------------------------------------------
    else if (action === 'get_requests') {
      var sheet = getOrInsertSheet(ss, SHEET_IJIN);
      var rows = sheet.getDataRange().getValues();
      var result = [];
      for (var i = 1; i < rows.length; i++) {
        // Kolom P adalah index 15 (urutan ke-16)
        result.push({
          id: rows[i][0],
          name: rows[i][1],
          nip: String(rows[i][2]),
          rank: rows[i][3],       
          position: rows[i][4],   
          department: rows[i][5], 
          type: rows[i][6],
          reason: rows[i][7],
          startDate: rows[i][8],
          startTime: rows[i][9],
          endDate: rows[i][10],
          endTime: rows[i][11],
          status: rows[i][12],    
          createdAt: rows[i][13], 
          docUrl: rows[i][15] || "" // Kolom P
        });
      }
      result.reverse(); 
      return responseJSON({ status: 'success', data: result });
    }

    // ------------------------------------------------------------------
    // 6. ACTION: GENERATE PDF & SAVE TO COLUMN P
    // ------------------------------------------------------------------
    else if (action === 'generate_pdf_drive') {
       if (!TEMPLATE_ID || TEMPLATE_ID.includes("ID_DOC")) return responseJSON({ status: 'error', message: 'Template ID Missing' });
       if (!FOLDER_ID || FOLDER_ID.includes("ID_FOLDER")) return responseJSON({ status: 'error', message: 'Folder ID Missing' });
      
       var templateFile = DriveApp.getFileById(TEMPLATE_ID);
       var destinationFolder = DriveApp.getFolderById(FOLDER_ID);

       // 1. Buat Dokumen Sementara
       var tempFile = templateFile.makeCopy("Surat_" + (data.nama || 'Ijin'), destinationFolder);
       var tempDoc = DocumentApp.openById(tempFile.getId());
       var body = tempDoc.getBody();
      
       var formatIndo = function(str) {
         if(!str) return "-";
         var d = new Date(str);
         if(isNaN(d.getTime())) return str;
         var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
         return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
       };

       // 2. Ganti Variabel
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

       tempDoc.saveAndClose();
      
       // 3. Konversi ke PDF
       var pdfBlob = tempFile.getAs(MimeType.PDF);
       var pdfFile = destinationFolder.createFile(pdfBlob);
       tempFile.setTrashed(true);
       
       var pdfUrl = pdfFile.getUrl();

       // 4. SIMPAN URL KE SPREADSHEET (Kolom P / Index 16)
       var sheet = getOrInsertSheet(ss, SHEET_IJIN);
       var rows = sheet.getDataRange().getValues();
       for (var i = 1; i < rows.length; i++) {
         if (rows[i][0] == data.id) {
           sheet.getRange(i + 1, 16).setValue(pdfUrl); // Update Kolom P
           break;
         }
       }
      
       return responseJSON({ status: 'success', url: pdfUrl, filename: pdfFile.getName() });
    }
    
    // ------------------------------------------------------------------
    // 7. ACTION: SYNC & GET USERS (Lengkap)
    // ------------------------------------------------------------------
    else if (action === 'sync_users' || action === 'get_users') {
        var sheetPegawai = getOrInsertSheet(ss, SHEET_PEGAWAI);
        var sheetLogin = getOrInsertSheet(ss, SHEET_LOGIN);
        
        if (action === 'sync_users') {
          if (sheetPegawai.getLastRow() > 1) sheetPegawai.getRange(2, 1, sheetPegawai.getLastRow()-1, 4).clearContent();
          if (sheetLogin.getLastRow() > 1) sheetLogin.getRange(2, 1, sheetLogin.getLastRow()-1, 5).clearContent();
          var rowsP = [], rowsL = [];
          data.users.forEach(function(u) {
              rowsP.push([u.name, "'"+u.nip, u.position, u.rank||"-"]);
              rowsL.push(["'"+u.nip, u.name, u.role, u.username||"", u.password||""]);
          });
          if(rowsP.length) sheetPegawai.getRange(2, 1, rowsP.length, 4).setValues(rowsP);
          if(rowsL.length) sheetLogin.getRange(2, 1, rowsL.length, 5).setValues(rowsL);
          return responseJSON({ status: 'success' });
        } 
        else if (action === 'get_users') {
          var dP = sheetPegawai.getDataRange().getValues();
          var dL = sheetLogin.getDataRange().getValues();
          var map = {};
          for(var i=1; i<dL.length; i++) {
            var n = String(dL[i][0]); if(!n) continue;
            map[n] = {nip:n, name:dL[i][1], role:dL[i][2], username:dL[i][3], password:String(dL[i][4])};
          }
          for(var j=1; j<dP.length; j++) {
             var nP = String(dP[j][1]);
             if(map[nP]) { map[nP].name = dP[j][0]; map[nP].position = dP[j][2]; map[nP].rank = dP[j][3]; }
             else { map[nP] = {nip:nP, name:dP[j][0], position:dP[j][2], rank:dP[j][3], role:'GURU', username:nP, password:nP}; }
          }
          return responseJSON({ status: 'success', data: Object.keys(map).map(function(k){return map[k]}) });
        }
    }

    return responseJSON({ status: 'error', message: 'Unknown action' });
  } catch (e) {
    return responseJSON({ status: 'error', message: String(e) });
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