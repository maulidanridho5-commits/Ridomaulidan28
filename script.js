// Application script: Sistem Manajemen Data Mahasiswa
// 1. CONFIGURATION & GLOBAL VARIABLES
const PASSWORD = "rido123";
let students = [];
let sortField = "nama";
let sortDescending = false;
let lastSortAlg = null;

// 2. DOM ELEMENTS
const loginOverlay = document.getElementById("loginOverlay");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const togglePwd = document.getElementById("togglePwd");
const logoutBtn = document.getElementById("logoutBtn");
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const binarySearchBtn = document.getElementById("binarySearchBtn");
const searchResultDiv = document.getElementById("searchResultMsg");
const sortFieldSelect = document.getElementById("sortField");
const bubbleSortBtn = document.getElementById("bubbleSortBtn");
const insertionSortBtn = document.getElementById("insertionSortBtn");
const mergeSortBtn = document.getElementById("mergeSortBtn");
const quickSortBtn = document.getElementById("quickSortBtn");
const sortAscBtn = document.getElementById("sortAscBtn");
const sortDescBtn = document.getElementById("sortDescBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
// seedBtn removed per user request: load via form/import instead
const toast = document.getElementById("toast");
const sortIndicator = document.getElementById('sortIndicator');
const studentForm = document.getElementById("studentForm");
const editIndexInput = document.getElementById("editIndex");
const nameInput = document.getElementById("nama");
const nimInput = document.getElementById("nim");
const majorInput = document.getElementById("major");
const ipkInput = document.getElementById("ipk");
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const statusText = document.getElementById("statusText");

// 3. AUTHENTICATION (Login & Logout)
loginBtn.addEventListener("click", login);
loginPassword.addEventListener("keypress", (e) => { if (e.key === "Enter") login(); });
logoutBtn.addEventListener("click", logout);
togglePwd.addEventListener("click", togglePassword);
// Sort control helper - ensures buttons enabled/disabled and updates indicator text
function updateSortControls() {
    const enabled = students && students.length > 0;
    [bubbleSortBtn, insertionSortBtn, mergeSortBtn, quickSortBtn].forEach(btn => {
        if (!btn) return;
        btn.disabled = !enabled;
        btn.setAttribute('aria-disabled', String(!enabled));
        btn.classList.toggle('inactive', !enabled);
        const algKey = btn.id.replace('SortBtn','').toLowerCase();
        btn.classList.toggle('active', lastSortAlg === algKey);
        btn.setAttribute('aria-pressed', String(lastSortAlg === algKey));
    });
    const algLabel = lastSortAlg ? (lastSortAlg.charAt(0).toUpperCase() + lastSortAlg.slice(1)) : '—';
    const orderLabel = sortDescending ? 'Desc' : 'Asc';
    if (sortIndicator) sortIndicator.textContent = `Alg: ${algLabel} • ${orderLabel}`;
}
function login() {
    const pwd = loginPassword.value;
    if (pwd === PASSWORD) {
        loginOverlay.classList.remove("show");
        loadData();
        showToast("✅ Login berhasil!");
    } else {
        showToast("❌ Password salah!");
        loginPassword.value = "";
    }
}

function logout() {
    if (confirm("🔐 Yakin ingin logout?")) {
        loginOverlay.classList.add("show");
        loginPassword.value = "";
        loginPassword.type = "password";
        togglePwd.textContent = "👁";
        tableBody.innerHTML = "";
        document.getElementById("totalStudents").textContent = "0";
        document.getElementById("highestIPK").textContent = "0.00";
        document.getElementById("lowestIPK").textContent = "0.00";
        document.getElementById("averageIPK").textContent = "0.00";
        showToast("🚪 Logout berhasil! Sampai jumpa lagi.");
    }
}

function togglePassword() {
    if (loginPassword.type === "password") {
        loginPassword.type = "text";
        togglePwd.textContent = "🚫";
    } else {
        loginPassword.type = "password";
        togglePwd.textContent = "👁";
    }
}

// ======= HELPERS & VALIDATION =======
function isNIMExists(nim, excludeIndex = -1) {
    return students.some((s, i) => s.nim === nim && i !== excludeIndex);
}

function validateEmailFormat(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

function validateIPKValue(ipk) {
    return typeof ipk === 'number' && ipk >= 0 && ipk <= 4;
}

// Deterministic pseudo-random helpers for sample data generation
const sampleMajors = [
    'Teknik Informatika', 'Sistem Informasi', 'Ilmu Komputer', 'Teknik Elektro',
    'Teknik Industri', 'Sains Data', 'Teknik Telekomunikasi'
];

function deterministicHash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

function createStudentProfile(name, nim, useRandom = true) {
    if (!useRandom) {
        const seed = deterministicHash(nim + name);
        const major = sampleMajors[seed % sampleMajors.length];
        const ipkVal = 2 + (seed % 201) / 200 * 2;
        const ipk = Math.min(4, Math.round(ipkVal * 100) / 100);
        const normalized = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '.');
        const email = `${normalized}${nim.slice(-3)}@mahasiswa.univ.ac.id`;
        return { nama: name, nim: nim, major, ipk, email };
    }
    // random version
    const major = sampleMajors[Math.floor(Math.random() * sampleMajors.length)];
    const ipk = Math.round((2 + Math.random() * 2) * 100) / 100; // between 2.00 and 4.00
    const normalized = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '.');
    const rand = Math.floor(Math.random() * 900) + 100; // 100-999
    const email = `${normalized}${rand}@mahasiswa.univ.ac.id`;
    return { nama: name, nim: nim, major, ipk, email };
}

// 4. DATA MANAGEMENT (Display & Delete)
function renderTable() {
    tableBody.innerHTML = "";
    if (students.length === 0) {
        const tr = document.createElement('tr');
        tr.className = 'empty-row';
        tr.innerHTML = `<td colspan="7"><div style="text-align:center;color:#ccc;padding:1rem;">Belum ada data mahasiswa. Tambahkan data pada form di atas.</div></td>`;
        tableBody.appendChild(tr);
        return;
    }
    students.forEach((student, index) => {
        const row = document.createElement("tr");
        row.dataset.index = index;
        // ensure no stale editing data-attr
        row.dataset.editing = 'false';
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.nama}</td>
            <td>${student.nim}</td>
            <td>${student.major}</td>
            <td>${student.ipk.toFixed(2)}</td>
            <td>${student.email}</td>
            <td>
                <button type="button" class="action-btn edit" onclick="startInlineEdit(${index})">✏️ Edit</button>
                <button type="button" class="action-btn delete" onclick="deleteStudent(${index})">🗑️ Hapus</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function deleteStudent(index) {
    if (confirm("Yakin hapus data ini?")) {
        // if an inline edit is active for this row, cancel it
        if (activeInlineEdit !== null && activeInlineEdit === index) activeInlineEdit = null;
        students.splice(index, 1);
        saveData();
        renderTable();
        updateDashboard();
        showToast("✅ Data dihapus!");
        // refresh search results if search box has value
        if (searchInput && searchInput.value.trim() !== '') linearSearch();
    }
}

function updateDashboard() {
    document.getElementById("totalStudents").textContent = students.length;
    if (students.length === 0) {
        document.getElementById("highestIPK").textContent = "0.00";
        document.getElementById("lowestIPK").textContent = "0.00";
        document.getElementById("averageIPK").textContent = "0.00";
        return;
    }
    const ipks = students.map(s => s.ipk);
    document.getElementById("highestIPK").textContent = Math.max(...ipks).toFixed(2);
    document.getElementById("lowestIPK").textContent = Math.min(...ipks).toFixed(2);
    const avg = ipks.reduce((a, b) => a + b, 0) / ipks.length;
    document.getElementById("averageIPK").textContent = avg.toFixed(2);
    if (typeof updateSortControls === 'function') updateSortControls();
}

// 5. SEARCH ALGORITHMS
searchBtn.addEventListener("click", linearSearch);
binarySearchBtn.addEventListener("click", binarySearch);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') linearSearch(); });

function linearSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return showToast("❌ Masukkan nama atau NIM!");
    // find all matches
    const matches = students
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.nama.toLowerCase().includes(query) || s.nim.includes(query));
    if (matches.length > 0) {
        showToast(`✅ Linear: ${matches.length} hasil ditemukan`);
        const indices = matches.map(m => m.i);
        indices.forEach(idx => highlightRow(idx));
        renderSearchResults(indices, query, 'Linear');
    } else {
        showToast("❌ Data tidak ditemukan!");
        renderSearchResults([], query, 'Linear');
    }
}

function binarySearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return showToast("❌ Masukkan nama atau NIM!");
    const sorted = [...students].sort((a, b) => a.nama.localeCompare(b.nama));
    let left = 0, right = sorted.length - 1, found = -1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (sorted[mid].nama.toLowerCase().includes(query)) {
            found = mid;
            break;
        }
        if (sorted[mid].nama.toLowerCase() < query) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    if (found !== -1) {
        const foundStudent = sorted[found];
        const originalIndex = students.findIndex(s => s.nama === foundStudent.nama && s.nim === foundStudent.nim);
        showToast(`✅ Binary: "${sorted[found].nama}" ditemukan O(log n) ⚡`);
        if (originalIndex !== -1) highlightRow(originalIndex);
        renderSearchResults([originalIndex], query, 'Binary');
    } else {
        showToast("❌ Data tidak ditemukan!");
        renderSearchResults([], query, 'Binary');
    }
}

function renderSearchResults(indices, query, method) {
    if (!searchResultDiv) return;
    searchResultDiv.innerHTML = "";
    if (!indices || indices.length === 0) {
        const noDiv = document.createElement('div');
        noDiv.textContent = `Tidak ditemukan matching untuk "${query}" (${method}).`;
        noDiv.style.color = '#ffb3b3';
        searchResultDiv.appendChild(noDiv);
        return;
    }
    indices.forEach(index => {
        const s = students[index];
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <div class="search-result-info">
                <strong>${s.nama}</strong>
                <span>NIM: ${s.nim}</span>
                <span>IPK: ${s.ipk.toFixed(2)}</span>
            </div>
            <div class="search-result-actions">
                <button type="button" class="edit" onclick="startInlineEdit(${index})">Edit</button>
                <button type="button" class="delete" onclick="deleteStudent(${index})">Hapus</button>
            </div>
        `;
        searchResultDiv.appendChild(item);
    });
    // scroll to the search result area
    searchResultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function highlightRow(index) {
    const rows = tableBody.querySelectorAll("tr");
    if (rows[index]) {
        rows[index].style.backgroundColor = "rgba(0, 255, 136, 0.2)";
        setTimeout(() => { rows[index].style.backgroundColor = ""; }, 2000);
    }
}

// 6. SORTING ALGORITHMS
sortFieldSelect.addEventListener("change", (e) => { 
    sortField = e.target.value; 
    if (students.length > 0 && lastSortAlg) {
        students = applySortAlgorithm(lastSortAlg);
        saveData(); renderTable(); updateDashboard();
    }
});
if (sortAscBtn && sortDescBtn) {
    // initialize button state
    sortAscBtn.setAttribute('aria-pressed', 'true');
    sortAscBtn.setAttribute('aria-label', 'Sort ascending');
    sortAscBtn.classList.add('asc', 'active');
    sortDescBtn.setAttribute('aria-pressed', 'false');
    sortDescBtn.setAttribute('aria-label', 'Sort descending');
    sortDescBtn.classList.add('desc');

    function updateOrderButtons() {
        sortAscBtn.setAttribute('aria-pressed', String(!sortDescending));
        sortDescBtn.setAttribute('aria-pressed', String(sortDescending));
        sortAscBtn.classList.toggle('active', !sortDescending);
        sortDescBtn.classList.toggle('active', sortDescending);
    }
    updateOrderButtons();

    // helper defined below in global scope
    // will call updateSortControls() after definition
    // keep placeholder for scope
    
    // updateSortControls();

    sortAscBtn.addEventListener('click', () => {
        sortDescending = false;
        updateOrderButtons();
        if (students.length > 0) {
            const alg = lastSortAlg || 'quick';
            lastSortAlg = lastSortAlg || 'quick';
            students = applySortAlgorithm(alg);
            saveData(); renderTable(); updateDashboard();
            showToast('✅ Berhasil: Ascending');
        } else {
            showToast('❗ Tidak ada data untuk diurutkan');
        }
    });

    sortDescBtn.addEventListener('click', () => {
        sortDescending = true;
        updateOrderButtons();
        if (students.length > 0) {
            const alg = lastSortAlg || 'quick';
            lastSortAlg = lastSortAlg || 'quick';
            students = applySortAlgorithm(alg);
            saveData(); renderTable(); updateDashboard();
            showToast('✅ Berhasil: Descending');
        } else {
            showToast('❗ Tidak ada data untuk diurutkan');
        }
    });
}
bubbleSortBtn.addEventListener("click", () => {
    students = applySortAlgorithm('bubble');
    saveData();
    renderTable();
    updateDashboard();
    lastSortAlg = 'bubble';
    updateSortControls();
    showToast("✅ Bubble Sort O(n²)");
});

insertionSortBtn.addEventListener("click", () => {
    students = applySortAlgorithm('insertion');
    saveData();
    renderTable();
    updateDashboard();
    lastSortAlg = 'insertion';
    updateSortControls();
    showToast("✅ Insertion Sort O(n²)");
});

mergeSortBtn.addEventListener("click", () => {
    students = applySortAlgorithm('merge');
    saveData();
    renderTable();
    updateDashboard();
    lastSortAlg = 'merge';
    updateSortControls();
    showToast("✅ Merge Sort O(n log n)");
});

quickSortBtn.addEventListener("click", () => {
    students = applySortAlgorithm('quick');
    saveData();
    renderTable();
    updateDashboard();
    lastSortAlg = 'quick';
    updateSortControls();
    showToast("✅ Quick Sort O(n log n)");
});

if (importBtn && importFile) {
  importBtn.addEventListener("click", () => { importFile.click(); });
  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                students = imported;
                saveData();
                renderTable();
                updateDashboard();
                showToast("📤 Data imported!");
            } else {
                showToast("❌ Format tidak valid!");
            }
        } catch (error) {
            showToast("❌ Error: " + error.message);
        }
    };
    reader.readAsText(file);
});
}

exportBtn.addEventListener("click", () => {
    const dataStr = JSON.stringify(students, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mahasiswa_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast("📥 Data exported!");
});

// removed sample loader per user request
// seedBtn code removed

// Bubble sort (ascending only). Use applySortOrder to flip order if needed.
function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (shouldSwap(arr[j], arr[j + 1])) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
    }
    return arr;
}

// Insertion sort (ascending only). Use applySortOrder to flip order if needed.
function insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        const key = arr[i];
        let j = i - 1;
        while (j >= 0) {
            if (!shouldSwap(arr[j], key)) break;
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
    return arr;
}

// Merge sort (ascending only). Use applySortOrder to flip order if needed.
function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
        const cmp = compareForSort(left[i], right[j]);
        if (cmp <= 0) result.push(left[i++]);
        else result.push(right[j++]);
    }
    return [...result, ...left.slice(i), ...right.slice(j)];
}

// Quick sort (ascending only). Use applySortOrder to flip order if needed.
function quickSort(arr) {
    if (arr.length <= 1) return arr;
    const pivot = arr[0];
    const less = arr.slice(1).filter(x => compareForSort(x, pivot) <= 0);
    const greater = arr.slice(1).filter(x => compareForSort(x, pivot) > 0);
    return [...quickSort(less), pivot, ...quickSort(greater)];
}

function applySortOrder(arr) {
  if (!Array.isArray(arr)) return arr;
  return sortDescending ? [...arr].reverse() : arr;
}

function applySortAlgorithm(alg) {
  let sorted = [];
  switch (alg) {
    case 'bubble': sorted = bubbleSort([...students]); break;
    case 'insertion': sorted = insertionSort([...students]); break;
    case 'merge': sorted = mergeSort([...students]); break;
    default: sorted = quickSort([...students]); break;
  }
  return applySortOrder(sorted);
}

// Comparator helpers for sorting
function valueForField(obj) {
    const v = sortField === 'ipk' ? Number(obj.ipk) : String(obj[sortField]).toLowerCase();
    return v;
}

function compareForSort(a, b) {
    const av = valueForField(a);
    const bv = valueForField(b);
    if (av === bv) return 0;
    if (typeof av === 'number') return av - bv;
    return av.localeCompare(bv);
}

function shouldSwap(a, b) {
    const cmp = compareForSort(a, b);
    return cmp > 0;
}

function saveData() {
    localStorage.setItem("students", JSON.stringify(students));
}

function loadData() {
    const data = localStorage.getItem("students");
    if (data) {
        try {
            const parsed = JSON.parse(data);
            // If parsed is an array and non-empty, keep it. Otherwise fall back to seeding.
            if (Array.isArray(parsed) && parsed.length > 0) {
                students = parsed;
            } else {
                // keep students empty; user can add via form or import
                students = [];
            }
        } catch (err) {
                        // If parsing failed, leave students empty
                        students = [];
        }
    } else {
                // No stored data: start with empty list so user can add via form or import
                students = [];
    }
    renderTable();
    updateDashboard();
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

// Form handling (Add & Edit)
if (studentForm) {
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const nim = nimInput.value.trim();
        const major = majorInput.value.trim();
        const ipk = parseFloat(ipkInput.value) || 0;
        const email = emailInput.value.trim();
        if (!name || !nim || !major || !email) {
            statusText.textContent = 'Lengkapi seluruh field.';
            return;
        }
        if (!validateEmailFormat(email)) {
            statusText.textContent = 'Format email tidak valid.';
            return;
        }
        if (!validateIPKValue(ipk)) {
            statusText.textContent = 'IPK harus antara 0.00 - 4.00.';
            return;
        }
        const payload = { nama: name, nim: nim, major: major, ipk: ipk, email: email };
        const editIndex = editIndexInput.value;
        const editIndexNum = editIndex !== '' ? Number(editIndex) : -1;
        if (isNIMExists(nim, editIndexNum)) {
            statusText.textContent = 'NIM sudah ada. Gunakan NIM lain.';
            showToast('❌ NIM sudah ada pada data!');
            return;
        }
        if (editIndex !== '') {
            students[Number(editIndex)] = payload;
            showToast('✅ Data Berhasil diedit');
            statusText.textContent = `Data ${name} diperbarui.`;
        } else {
            students.push(payload);
            showToast('✅ Data ditambahkan!');
            statusText.textContent = `Data ${name} ditambahkan.`;
        }
        saveData();
        renderTable();
        updateDashboard();
        resetForm();
        if (searchInput && searchInput.value.trim() !== '') linearSearch();
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetForm();
    });
}

function resetForm() {
    if (!studentForm) return;
    studentForm.reset();
    editIndexInput.value = '';
    submitBtn.textContent = 'Simpan';
    statusText.textContent = 'Form direset.';
}

function editStudent(index) {
    // Deprecated: keep for compatibility - redirect to inline editor
    startInlineEdit(index);
}

let activeInlineEdit = null;
function startInlineEdit(index) {
    if (activeInlineEdit !== null) {
        showToast('⚠️ Selesaikan edit sebelumnya terlebih dahulu.');
        return;
    }
    const s = students[index];
    if (!s) return;
    const rows = tableBody.querySelectorAll('tr');
    const row = [...rows].find(r => r.dataset.index === String(index));
    if (!row) return;
    // Save original HTML in case of cancel
    row.dataset.original = row.innerHTML;
    // mark row as being edited for styling
    row.dataset.editing = 'true';
    row.innerHTML = `
        <td>${index + 1}</td>
        <td><input type="text" class="inline-nama" value="${s.nama.replace(/"/g, '&quot;')}" /></td>
        <td><input type="text" class="inline-nim" value="${s.nim}" /></td>
        <td><input type="text" class="inline-major" value="${s.major.replace(/"/g, '&quot;')}" /></td>
        <td><input type="number" step="0.01" min="0" max="4" class="inline-ipk" value="${s.ipk}" /></td>
        <td><input type="email" class="inline-email" value="${s.email}" /></td>
        <td>
            <button type="button" class="action-btn save" onclick="saveInlineEdit(${index})">💾 Save</button>
            <button type="button" class="action-btn cancel" onclick="cancelInlineEdit(${index})">✖️ Cancel</button>
        </td>
    `;
    activeInlineEdit = index;
}

function saveInlineEdit(index) {
    const rows = tableBody.querySelectorAll('tr');
    const row = [...rows].find(r => r.dataset.index === String(index));
    if (!row) return;
    const newName = row.querySelector('.inline-nama').value.trim();
    const newNim = row.querySelector('.inline-nim').value.trim();
    const newMajor = row.querySelector('.inline-major').value.trim();
    const newIpk = parseFloat(row.querySelector('.inline-ipk').value) || 0;
    const newEmail = row.querySelector('.inline-email').value.trim();
    if (!newName || !newNim || !newMajor || !newEmail) {
        showToast('❌ Lengkapi seluruh field.');
        return;
    }
    if (!validateEmailFormat(newEmail)) {
        showToast('❌ Format email tidak valid.');
        return;
    }
    if (!validateIPKValue(newIpk)) {
        showToast('❌ IPK harus antara 0.00 - 4.00');
        return;
    }
    if (isNIMExists(newNim, index)) {
        showToast('❌ NIM sudah ada. Gunakan NIM lain.');
        return;
    }
    students[index] = { nama: newName, nim: newNim, major: newMajor, ipk: newIpk, email: newEmail };
    saveData();
    renderTable();
    updateDashboard();
    showToast('✅ Data Berhasil diedit');
    activeInlineEdit = null;
    if (searchInput && searchInput.value.trim() !== '') linearSearch();
}

function cancelInlineEdit(index) {
    const rows = tableBody.querySelectorAll('tr');
    const row = [...rows].find(r => r.dataset.index === String(index));
    if (!row) return;
    // if we saved original HTML, restore
    if (row.dataset.original) {
        row.innerHTML = row.dataset.original;
        delete row.dataset.original;
        row.dataset.editing = 'false';
    }
    activeInlineEdit = null;
}

// allow escape to cancel an active inline edit
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeInlineEdit !== null) {
        cancelInlineEdit(activeInlineEdit);
    }
});

loadData();
