// --- CONFIGURATION ---
const SUPABASE_URL = 'https://gpjdyjnxkzlijwsnnoxq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwamR5am54a3psaWp3c25ub3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODgyNTEsImV4cCI6MjA4NTg2NDI1MX0.pI7SUBS6LG7IKL4YrdDdcPodk1Ft60aj2_l82kjWFoU'; // คุณต้องนำค่าจาก dashboard มาใส่ที่นี่

// ใช้ชื่อ supabaseClient เพื่อเลี่ยงความขัดแย้งกับตัวแปร global 'supabase' จาก library
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM ELEMENTS ---
const form = document.getElementById('orderForm');
const universitySelect = document.getElementById('university');
const facultySelect = document.getElementById('faculty');
const genderRadios = document.querySelectorAll('input[name="gender"]');
const removeMustacheCheckbox = document.getElementById('remove_mustache');
const dropZone = document.getElementById('dropZone');
const faceInput = document.getElementById('faceImage');
const imagePreview = document.getElementById('imagePreview');
const uploadPlaceholder = document.querySelector('.upload-placeholder');
const gownPreviewImg = document.getElementById('gownPreviewImg');
const previewResult = document.getElementById('previewResult');
const enableHairstyle = document.getElementById('enableHairstyle');
const hairstyleContainer = document.getElementById('hairOptions');
const submitBtn = document.getElementById('submitBtn');
const statusMessage = document.getElementById('statusMessage');
// Camera Elements
const openCameraBtn = document.getElementById('openCameraBtn');
const cameraContainer = document.getElementById('cameraContainer');
const cameraFeed = document.getElementById('cameraFeed');
const cameraCanvas = document.getElementById('cameraCanvas');
const captureBtn = document.getElementById('captureBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');

let bgPreviewBox = null;

// --- VERIFICATION DOM ---
const verifyInput = document.getElementById('verifyAnswer');
const verifyQuestionSpan = document.getElementById('verifyQuestion');
let verifyResult = 0;

// --- STEP CONTROL ---
let currentStep = 1;
const formSteps = document.querySelectorAll('.form-step');
const stepIndicators = document.querySelectorAll('.step-indicator');
const stepLines = document.querySelectorAll('.step-line');

window.nextStep = function (step) {
    if (!validateStep(currentStep)) return;
    showStep(step);
}

window.prevStep = function (step) {
    showStep(step);
}

function showStep(step) {
    formSteps.forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');

    // Update Indicators
    stepIndicators.forEach((ind, idx) => {
        const stepNum = idx + 1;
        ind.classList.remove('active', 'completed');
        if (stepNum === step) ind.classList.add('active');
        if (stepNum < step) ind.classList.add('completed');
    });

    // Update Lines
    stepLines.forEach((line, idx) => {
        if (idx + 1 < step) line.classList.add('active');
        else line.classList.remove('active');
    });

    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(step) {
    if (step === 1) {
        if (!faceInput.files.length) {
            showCustomAlert('กรุณาอัพโหลดรูปก่อนไปขั้นตอนถัดไป', 'error');
            return false;
        }
        // Moved Gender Check to Step 1
        const gender = document.querySelector('input[name="gender"]:checked');
        if (!gender) {
            showCustomAlert('กรุณาเลือกเพศ', 'error');
            return false;
        }
    }
    // Step 2: University (Was Step 3)
    if (step === 2) {
        const uni = document.getElementById('university').value;
        const faculty = document.getElementById('faculty').value;
        const manualDetails = document.getElementById('custom_gown_details').value.trim();

        if ((!uni || !faculty) && !manualDetails) {
            showCustomAlert('กรุณาเลือกมหาลัย/คณะ หรือระบุข้อมูลเพิ่มเติม', 'error');
            return false;
        }
    }
    return true;
}

// --- DATA ---
let universityData = [];

// --- INITIALIZATION ---
async function init() {
    try {
        const response = await fetch('data/universities.json');
        const data = await response.json();
        universityData = data.มหาวิทยาลัย;

        populateUniversities();
        setupHairstyles();
        initColorSwatches(); // สร้างปุ่มสีฉากหลัง

        // เช็คเพศตอนเริ่มต้น (ถ้ามี)
        const initialGender = document.querySelector('input[name="gender"]:checked');
        if (initialGender) {
            toggleGenderOptions(initialGender.value);
            setupHairstyles(initialGender.value);
        }

        generateMathQuestion();

        // Hairstyle checkbox handling is now managed by HAIRSTYLE LOGIC section

        // Get background preview box reference
        bgPreviewBox = document.getElementById('bgPreviewBox');
        if (bgPreviewBox) {
            bgPreviewBox.style.backgroundColor = '#ffffff'; // Start with white
        }

    } catch (err) {
        console.error('Error loading data:', err);
    }
}

function initColorSwatches() {
    const container = document.getElementById('bgColorSwatches');
    studioColors.forEach((color, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'color-btn';

        if (color.start) {
            btn.style.background = `radial-gradient(circle, ${color.start} 0%, ${color.end} 100%)`;
        } else {
            // Checkered pattern สำหรับโปร่งใส
            btn.style.background = `conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)`;
        }

        btn.title = color.name;
        btn.onclick = () => setBgColor(color, btn);

        container.appendChild(btn);
    });
}

function populateUniversities() {
    universityData.forEach(uni => {
        const option = document.createElement('option');
        option.value = uni.name;
        option.textContent = uni.name;
        universitySelect.appendChild(option);
    });
}

function setupHairstyles(gender) {
    hairstyleContainer.innerHTML = ''; // Clear old options

    // Always add 'No Hairstyle' option
    const noHairLabel = document.createElement('label');
    noHairLabel.className = 'hair-card';
    noHairLabel.innerHTML = `
        <input type="radio" name="hairstyle" value="none" checked>
        <div class="card-content">
            <span style="display:block; margin-bottom:5px;">🚫</span>
            ไม่ใส่ทรงผม
        </div>
    `;
    hairstyleContainer.appendChild(noHairLabel);

    if (!gender) return;

    const maleHairstyles = [
        { name: 'รองทรงสูง', file: 'ชายรองทรงสูง.png' },
        { name: 'รองทรงหน้าหวีเป๋', file: 'ชาย_รองทรงหน้าหวีเป๋.png' },
        { name: 'เซตผม', file: 'ชาย_เซตผม.png' },
        { name: 'ผมบ็อบ', file: 'ชาย_ผมบ็อบ.png' },
        { name: 'โกนหัว', file: 'ชาย_โกนหัว.png' }
    ];

    const femaleHairstyles = [
        { name: 'ปล่อยผมยาว', file: 'หญิง_ปล่อยผมยาวพาดหลัง.png' },
        { name: 'ทรงนักเรียนสั้น', file: 'หญิง_ทรงนักเรียนสั้น.png' },
        { name: 'ผมสั้นโฉบเฉี่ยว', file: 'หญิง_ผมสั้นโฉบเฉี่ยว.png' },
        { name: 'รวบผมสั้น', file: 'หญิง_รวบผมสั้น.png' },
        { name: 'รวบผมย้อมสี', file: 'หญิง_รวบผมย้อมสี.png' }
    ];

    const targetHairstyles = gender === 'male' ? maleHairstyles : femaleHairstyles;

    targetHairstyles.forEach(hair => {
        const label = document.createElement('label');
        label.className = 'hair-card';
        // Check local or production path. Assuming relative to index.html
        const imgPath = `assets/ทรงผม/${hair.file}`;

        label.innerHTML = `
            <input type="radio" name="hairstyle" value="${hair.file}">
            <div class="card-content">
                <img src="${imgPath}" alt="${hair.name}" style="width: 100%; height: auto; border-radius: 4px; margin-bottom: 5px;">
                ${hair.name}
            </div>
        `;
        hairstyleContainer.appendChild(label);
    });
}

// --- EVENT LISTENERS ---

// เปลี่ยนมหาลัย -> โหลดคณะ
universitySelect.addEventListener('change', (e) => {
    const uniName = e.target.value;
    facultySelect.innerHTML = '<option value="">เลือกคณะ...</option>';

    if (!uniName) {
        facultySelect.disabled = true;
        updateGownPreview();
        return;
    }

    const uni = universityData.find(u => u.name === uniName);
    if (uni) {
        console.log('University:', uniName, 'Faculties:', uni.faculties);

        if (uni.faculties && uni.faculties.length > 0) {
            let defaultOptionIndex = -1;

            uni.faculties.forEach((fac, idx) => {
                const option = document.createElement('option');

                // Use '_default' for empty faculty to avoid conflict with placeholder
                const optionValue = (fac === '') ? '_default' : fac;
                option.value = optionValue;

                // Track the default option index (account for placeholder at index 0)
                if (fac === '') {
                    defaultOptionIndex = idx + 1;
                }

                // Prettify Display Name
                let displayName = fac;
                if (fac === '' || fac === '_default') {
                    displayName = 'มาตรฐาน (แบบ 1)';
                } else if (displayName === '(2)') {
                    displayName = 'แบบที่ 2';
                } else if (displayName === '(3)') {
                    displayName = 'แบบที่ 3';
                } else if (displayName.includes('-(2)')) {
                    displayName = displayName.replace('-(2)', ' (แบบที่ 2)');
                } else if (displayName.includes('-(3)')) {
                    displayName = displayName.replace('-(3)', ' (แบบที่ 3)');
                }

                option.textContent = displayName;
                facultySelect.appendChild(option);
                console.log('Added option:', optionValue, '->', displayName);
            });
            facultySelect.disabled = false;

            // Auto-select: prefer _default option, otherwise select first
            if (defaultOptionIndex > 0) {
                facultySelect.selectedIndex = defaultOptionIndex;
            } else if (facultySelect.options.length > 1) {
                facultySelect.selectedIndex = 1;
            }
        } else {
            // Handle universities with no specific faculties (Single Gown)
            const option = document.createElement('option');
            option.value = 'all'; // Dummy value to pass validation
            option.textContent = 'มาตรฐาน / รวมทุกคณะ';
            facultySelect.appendChild(option);
            facultySelect.value = 'all'; // Auto-select
            facultySelect.disabled = false; // Enabled so user sees it
        }
    }
    updateGownPreview();
});

facultySelect.addEventListener('change', updateGownPreview);

// เปลี่ยนเพศ -> แสดง/ซ่อน เมนูหนวด / เมนูหญิง
document.getElementsByName('gender').forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleGenderOptions(e.target.value);
        setupHairstyles(e.target.value);
        updateGownPreview();

        // Auto Advance if image is already uploaded
        /*
        if (currentStep === 1 && faceInput.files.length > 0) {
            setTimeout(() => window.nextStep(2), 600);
        }
        */
        // Check if we can proceed (Verified + File)
        checkAndProceedStep1();
    });
});

function toggleGenderOptions(gender) {
    const personalOpts = document.getElementById('personalOptions');
    if (personalOpts) {
        personalOpts.classList.remove('hidden');
    }
}

// อัพโหลดรูป
dropZone.addEventListener('click', () => {
    // Only allow click if verified? OR allow click but don't upload.
    // Let's allow click so they can see preview, but block upload.
    faceInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

faceInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

function setBgColor(colorObj, btnElement) {
    const bgColorInput = document.getElementById('bgColor');
    if (colorObj.start) {
        bgColorInput.value = colorObj.start;
        bgColorInput.dataset.gradient = JSON.stringify(colorObj);

        // Update Preview
        if (bgPreviewBox) {
            bgPreviewBox.style.background = `radial-gradient(circle, ${colorObj.start} 0%, ${colorObj.end} 100%)`;
        }
    } else {
        bgColorInput.value = '#FFFFFF';
        bgColorInput.dataset.gradient = JSON.stringify(colorObj);
        // Update Preview for Transparent/White
        if (bgPreviewBox) {
            bgPreviewBox.style.background = '#ffffff';
        }
    }

    // Highlight Selected Button
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    if (btnElement) btnElement.classList.add('selected');
}

let currentUploadedUrl = null;
let pendingUploadFile = null;
let isVerified = false;

async function handleFile(file) {
    if (!file.type.startsWith('image/')) return;

    // 1. Show Preview Immediately
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
        uploadPlaceholder.classList.add('hidden');

        // REVEAL VERIFICATION BOX HERE
        const verifyBox = document.getElementById('verificationBox');
        if (verifyBox) {
            verifyBox.classList.remove('hidden');
            // Scroll to it
            setTimeout(() => {
                verifyBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                verifyInput.focus();
            }, 300);
        }
    };
    reader.readAsDataURL(file);

    // Sync input files if needed (e.g. from Drag & Drop)
    if (faceInput.files[0] !== file) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        faceInput.files = dataTransfer.files;
    }

    // Store file for later upload
    pendingUploadFile = file;
    currentUploadedUrl = null; // Reset prev url

    // Remove old badge
    const oldBadge = document.getElementById('uploadBadge');
    if (oldBadge) oldBadge.remove();

    // Check Verification
    if (isVerified) {
        // If already verified, start upload immediately
        startUploadProcess(file);
    } else {
        // Show indicator on image that verification is needed
        // (Optional, maybe not needed since box appears below)
    }
}

async function startUploadProcess(file) {
    // 2. Start Background Upload (Auto Upload)
    const oldBadge = document.getElementById('uploadBadge');
    if (oldBadge) oldBadge.remove();

    const loadingBadge = document.createElement('div');
    loadingBadge.id = 'uploadBadge';
    loadingBadge.className = 'upload-badge';
    loadingBadge.innerHTML = '<div class="loader-sm"></div> กำลังอัพโหลด...';
    dropZone.appendChild(loadingBadge);

    try {
        currentUploadedUrl = await uploadImageSubroutine(file);

        if (currentUploadedUrl === 'FAILED_UPLOAD') {
            loadingBadge.innerHTML = '⚠️ อัพโหลดไม่ผ่าน (ส่งรูปในแชทแทนได้)';
            loadingBadge.classList.add('error');
        } else {
            loadingBadge.innerHTML = '✅ อัพโหลดเรียบร้อย';
            loadingBadge.classList.add('success');

            // Hide success badge after 3s
            setTimeout(() => {
                loadingBadge.style.opacity = '0';
                setTimeout(() => loadingBadge.remove(), 500);
            }, 3000);

            // Auto Advance
            setTimeout(() => {
                if (currentStep === 1) window.nextStep(2);
            }, 800);
        }

    } catch (err) {
        console.error(err);
        loadingBadge.innerHTML = '⚠️ อัพโหลดไม่ผ่าน (ส่งรูปในแชทแทนได้)';
        loadingBadge.classList.add('error');
        currentUploadedUrl = 'FAILED_UPLOAD';
    }
}

function checkAndProceedStep1() {
    // Helper to auto-advance if everything is ready
    if (isVerified && pendingUploadFile && currentUploadedUrl) {
        if (currentStep === 1) window.nextStep(2);
    } // If file exists but not uploaded, handleFile logic (or verify logic) handles it
}

// --- CAMERA LOGIC ---
let stream = null;

// Prevent accidental clicks on the container triggering file upload
cameraContainer.addEventListener('click', (e) => {
    e.stopPropagation();
});

openCameraBtn.addEventListener('click', async (e) => {
    e.stopPropagation(); // ป้องกัน trigger dropZone
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }
        });
        cameraFeed.srcObject = stream;
        cameraContainer.classList.remove('hidden');
    } catch (err) {
        showCustomAlert('ไม่สามารถเปิดกล้องได้: ' + err.message, 'error');
    }
});

closeCameraBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stopCamera();
});

captureBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const context = cameraCanvas.getContext('2d');
    cameraCanvas.width = cameraFeed.videoWidth;
    cameraCanvas.height = cameraFeed.videoHeight;

    // Flip horizontally if front camera (mirror effect)
    context.translate(cameraCanvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);

    cameraCanvas.toBlob((blob) => {
        const file = new File([blob], "selfie_" + Date.now() + ".jpg", { type: "image/jpeg" });

        // Pseudo FileList for input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        faceInput.files = dataTransfer.files;

        handleFile(file);
        stopCamera();
        showCustomAlert('ถ่ายรูปเรียบร้อย!', 'success');
    }, 'image/jpeg', 0.9);
});

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    cameraContainer.classList.add('hidden');
}

// อัพเดทรูปพรีวิวครุย
function updateGownPreview() {
    const uniName = universitySelect.value;
    const faculty = facultySelect.value;
    const gender = document.querySelector('input[name="gender"]:checked').value;

    if (!uniName || !faculty) {
        previewResult.classList.add('hidden');
        return;
    }

    const uni = universityData.find(u => u.name === uniName);
    const genderThai = gender === 'male' ? 'ชาย' : 'หญิง';

    // สร้างชื่อไฟล์ตามแพทเทิร์น
    let filename;

    // Check if faculty is empty, 'all', '_default', or doesn't exist
    if (!faculty || faculty === 'all' || faculty === '' || faculty === '_default') {
        // No faculty - use pattern without faculty
        filename = `ครุย${genderThai}-${uniName}.png`;
    } else {
        // With faculty
        filename = `ครุย${genderThai}-${uniName}-${faculty}.png`;
    }

    // จำลอง path (ในระบบจริงจะใช้ที่เก็บรูปครุย)
    // ใช้ encodeURIComponent เพื่อแก้ปัญหาภาษาไทยใน URL
    gownPreviewImg.alt = filename;
    previewResult.classList.remove('hidden');

    // หมายเหตุ: ใน GitHub Pages คุณต้องมีโฟลเดอร์ assets/gowns/ ที่เก็บรูปเหล่านี้ไว้
    // กรณีไม่มีรูปพรีวิว (Error) ให้ใช้รูป Placeholder
    gownPreviewImg.onerror = () => {
        gownPreviewImg.onerror = null; // ป้องกัน Loop
        gownPreviewImg.src = 'https://placehold.co/100x130?text=No+Preview';
    };

    // Construct URL with proper encoding
    const encodedPath = encodeURIComponent(uni.path);
    const encodedFilename = encodeURIComponent(filename);

    // Correct Path: assets/ชุดครุย/ป.ตรี/<UniPath>/<Filename>
    gownPreviewImg.src = `assets/ชุดครุย/ป.ตรี/${uni.path}/${filename}`;
}

// --- HAIRSTYLE LOGIC ---
if (enableHairstyle) {
    enableHairstyle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            hairstyleContainer.classList.remove('hidden');

            // Only load if empty
            if (hairstyleContainer.innerHTML.trim() === '') {
                // Get hairs from serverAssets (if PHP injected) or use fallback
                const hairs = (window.serverAssets && window.serverAssets.hair) || [];

                hairstyleContainer.innerHTML = '';

                if (hairs.length === 0) {
                    const msg = document.createElement('div');
                    msg.className = 'text-center text-gray-400 py-4 text-sm';
                    msg.innerText = 'ไม่พบข้อมูลทรงผม (กรุณาตรวจสอบ assets/hairstyles)';
                    hairstyleContainer.appendChild(msg);
                } else {
                    const grid = document.createElement('div');
                    grid.className = 'grid grid-cols-3 gap-3'; // Tailwind Grid

                    hairs.forEach((h, index) => {
                        // Determine path
                        const src = h.includes('/') ? h : `assets/hairstyles/${h}`;

                        const item = document.createElement('div');
                        item.className = 'hair-item cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg p-2 transition relative flex flex-col items-center gap-2 bg-slate-800';

                        // Checkbox hidden (logic handles click)
                        const input = document.createElement('input');
                        input.type = 'radio';
                        input.name = 'hairstyle';
                        input.value = h;
                        input.className = 'hidden';

                        // Image
                        const img = document.createElement('img');
                        img.src = src;
                        img.className = 'w-full h-auto rounded object-cover';
                        img.onerror = function () { this.src = `https://placehold.co/100x120?text=Hair${index + 1}`; };

                        // Check indicator
                        const checkIcon = document.createElement('div');
                        checkIcon.className = 'absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hidden check-icon';
                        checkIcon.innerText = '✓';

                        item.appendChild(img);
                        item.appendChild(input);
                        item.appendChild(checkIcon);

                        // Click Handler
                        item.addEventListener('click', () => {
                            // Deselect all
                            grid.querySelectorAll('.hair-item').forEach(el => {
                                el.classList.remove('border-blue-500', 'bg-blue-900');
                                el.querySelector('.check-icon').classList.add('hidden');
                                el.querySelector('input').checked = false;
                            });

                            // Select this
                            item.classList.add('border-blue-500', 'bg-blue-900');
                            item.querySelector('.check-icon').classList.remove('hidden');
                            input.checked = true;
                        });

                        grid.appendChild(item);
                    });
                    hairstyleContainer.appendChild(grid);
                }
            }
        } else {
            hairstyleContainer.classList.add('hidden');
            // Reset selection
            const checked = hairstyleContainer.querySelector('input:checked');
            if (checked) checked.checked = false;
            hairstyleContainer.querySelectorAll('.hair-item').forEach(el => {
                el.classList.remove('border-blue-500', 'bg-blue-900');
                el.querySelector('.check-icon').classList.add('hidden');
            });
        }
    });
}

// --- SUBMISSION LOGIC ---

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = faceInput.files[0];
    if (!file) {
        showCustomAlert('กรุณาอัพโหลดรูปภาพ', 'error');
        return;
    }

    // Double check verification
    if (verifyInput && typeof verifyResult !== 'undefined') {
        if (parseInt(verifyInput.value) !== verifyResult) {
            showCustomAlert('กรุณาตอบคำถามยืนยันตัวตนให้ถูกต้อง (Math Incorrect)', 'error');
            // Re-disable button just in case
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
            }
            return;
        }
    }

    setLoading(true);
    showMessage('กำลังอัพโหลดรูปภาพ...', '');

    try {
        let imageUrl = currentUploadedUrl;

        // If background upload failed or hasn't finished/started, try again now
        if (!imageUrl) {
            showMessage('กำลังอัพโหลดรูปภาพ...', '');
            imageUrl = await uploadImageSubroutine(file);
        }

        // Graceful Fallback: If upload still fails, assume manual send
        let finalImageUrl = imageUrl;
        if (!imageUrl || imageUrl === 'FAILED_UPLOAD') {
            console.warn('All uploads failed. Using fallback.');
            finalImageUrl = '❌ (กรุณาส่งรูปให้แอดมินทางแชท)';
            // Do not throw error, allow submit to proceed
        }

        // 4. บันทึกข้อมูลลง Database
        const uniName = universitySelect.value;
        const uni = universityData.find(u => u.name === uniName);
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const genderThai = gender === 'male' ? 'ชาย' : 'หญิง';
        const faculty = facultySelect.value;

        // สร้างชื่อไฟล์แบบเดียวกับ updateGownPreview
        let gownFilename;
        if (!faculty || faculty === 'all' || faculty === '' || faculty === '_default') {
            gownFilename = `ครุย${genderThai}-${uniName}.png`;
        } else {
            gownFilename = `ครุย${genderThai}-${uniName}-${faculty}.png`;
        }

        const manualDetailsInput = document.getElementById('custom_gown_details').value.trim();
        const uniDisplay = (uniName && faculty && faculty !== 'all' && faculty !== '' && faculty !== '_default') ? `${uniName} ${faculty}` : (uniName || manualDetailsInput || 'Manual Entry');

        // HACK: Pack hairstyle and background into manual_details JSON
        // because database schema update is pending
        const hairstyleVal = document.querySelector('input[name="hairstyle"]:checked')?.value || 'none';
        // Fix: Get value from hidden input instead of undefined variable
        const bgColorVal = document.getElementById('bgColor')?.value || '#ffffff';

        // ย้าย Logic การรวม Note มาไว้ตรงนี้ เพื่อบันทึกลง Database ด้วย
        let notesParts = [];
        // Removed personal checkboxes logic

        const reqsStr = notesParts.length > 0 ? ` (เพิ่มเติม: ${notesParts.join(', ')})` : '';
        const fullNote = manualDetailsInput + reqsStr;

        const orderPin = Math.random().toString(36).substr(2, 6).toUpperCase();

        const packedDetails = JSON.stringify({
            note: fullNote,
            hairstyle: hairstyleVal,
            background_color: bgColorVal,
            pin: orderPin
        });

        // Try to save to database, but don't fail if database has issues
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .insert([{
                    gender: gender,
                    university: uniName || 'Manual Entry',
                    faculty: (faculty && faculty !== 'all' && faculty !== '_default') ? faculty : '',
                    face_image_url: finalImageUrl,
                    gown_file_path: uni ? `${uni.path}/${gownFilename}` : 'custom',
                    status: 'pending',
                    manual_details: packedDetails // Send JSON with all extra info
                }]);

            if (error) {
                console.warn('Database save failed (non-critical):', error.message);
            }
        } catch (dbErr) {
            console.warn('Database connection failed (non-critical):', dbErr);
        }


        // Build Custom Notes String


        const notesStr = notesParts.length > 0 ? notesParts.join(', ') : '-';

        const jobCommand = `📌 สั่งทำรูป: [${orderPin}]\n🎓 สถาบัน: ${uniDisplay}\n🤵 เพศ: ${genderThai}\n💇 ทรงผม: ${document.querySelector('input[name="hairstyle"]:checked').value === 'none' ? 'ไม่ใส่' : 'ใส่ทรงผม'}\n🎨 พื้นหลัง: ${JSON.parse(document.getElementById('bgColor').dataset.gradient || '{}').name || 'ขาว'}\n📝 เพิ่มเติม: ${notesStr}\n🔗 รูปภาพ: ${finalImageUrl}`;

        showSuccessView(orderPin, jobCommand);
        form.reset();
        currentStep = 1;

    } catch (err) {
        console.error(err);
        showMessage('❌ เกิดข้อผิดพลาด: ' + err.message, 'status-error');
    } finally {
        setLoading(false);
    }
});

function showSuccessView(pin, command) {
    // Show Modal
    const modal = document.getElementById('successModal');
    const pinDisplay = document.getElementById('successPin');

    if (modal && pinDisplay) {
        pinDisplay.textContent = pin;
        modal.classList.remove('hidden');

        // Log command to console just in case
        console.log("Order Command:", command);
    }
}

window.copyCommand = function (text) {
    navigator.clipboard.writeText(text).then(() => {
        showCustomAlert('คัดลอกคำสั่งงานแล้ว! ส่งให้แอดมินทางแชทได้เลยครับ', 'success');
    });
}

function showCustomAlert(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    notification.innerHTML = `
        <span style="font-size: 1.5rem;">${icon}</span>
        <div>${message}</div>
    `;

    container.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOutRight 0.5s forwards';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// --- API HELPERS ---

async function uploadImageSubroutine(file) {
    let imageUrl = '';

    // 1. Priority: Supabase (Try for all files)
    console.log('Uploading to Supabase...');
    imageUrl = await uploadToSupabase(file);

    // 2. Fallback: Tempfile (Temporary 24h)
    if (!imageUrl) {
        console.warn('Supabase failed. Trying Tempfile (24h)...');
        imageUrl = await uploadToTempfile(file);
    }

    if (!imageUrl) {
        console.error('All upload methods failed.');
        return 'FAILED_UPLOAD';
    }

    return imageUrl;
}

async function uploadToSupabase(file) {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const fileName = `${Date.now()}-${cleanName}`;

    // Explicitly define content type if possible, though Supabase/Browser usually detects it
    const { data, error } = await supabaseClient.storage
        .from('faces')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        // Suppress RLS errors as we have a fallback
        // console.info('Main server upload restriction (RLS). Switching to backup server...', error.message);
        return null;
    }

    const { data: { publicUrl } } = supabaseClient.storage
        .from('faces')
        .getPublicUrl(fileName);

    return publicUrl;
}

// function uploadToCatbox removed since PHP proxy is not supported

async function uploadToTempfile(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        // Extend to 24h
        formData.append('expiryHours', '24');

        const response = await fetch('https://tempfile.org/api/upload/local', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success && data.files && data.files.length > 0) {
            return `https://tempfile.org/${data.files[0].id}`;
        }
    } catch (e) {
        console.warn('Tempfile failed:', e);
    }
    return null;
}

// --- UTILS ---

// Studio Background Colors (from index.php)
const studioColors = [
    { start: '#3b82f6', end: '#1e3a8a', name: 'น้ำเงิน' }, // Blue
    { start: '#ec4899', end: '#831843', name: 'ชมพู' }, // Pink
    { start: '#a855f7', end: '#581c87', name: 'ม่วง' }, // Purple
    { start: '#22c55e', end: '#14532d', name: 'เขียว' }, // Green
    { start: '#ef4444', end: '#7f1d1d', name: 'แดง' }, // Red
    { start: '#f59e0b', end: '#78350f', name: 'ส้ม' }, // Orange
    { start: '#64748b', end: '#1e293b', name: 'เทา' }, // Slate
    { start: '#ffffff', end: '#94a3b8', name: 'ขาว' }, // White/Grey
    { start: '#18181b', end: '#000000', name: 'ดำ' }, // Black
    { start: null, end: null, name: 'โปร่งใส' }  // Transparent
];

// Note: setBgColor is already defined earlier (line 310-334) with preview logic

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    const text = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');

    if (isLoading) {
        text.classList.add('hidden');
        loader.classList.remove('hidden');
    } else {
        text.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

function showMessage(msg, className) {
    statusMessage.textContent = msg;
    statusMessage.className = 'status-message ' + className;
}

init();

// --- HUMAN VERIFICATION ---
function generateMathQuestion() {
    if (!verifyInput || !verifyQuestionSpan) return;

    // Generate numbers between 1 and 9
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    verifyResult = num1 + num2;

    verifyQuestionSpan.textContent = `${num1} + ${num2}`;


    verifyQuestionSpan.textContent = `${num1} + ${num2}`;
    verifyInput.value = '';

    isVerified = false;
}

if (verifyInput) {
    verifyInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        const errorMsg = document.getElementById('verifyError');
        const box = document.getElementById('verificationBox');

        if (val === verifyResult) {
            isVerified = true;
            verifyInput.style.borderColor = '#22c55e';
            verifyInput.style.backgroundColor = '#f0fdf4';
            if (errorMsg) errorMsg.classList.add('hidden');

            // Hide the box visually
            if (box) {
                box.style.transition = 'opacity 0.5s, transform 0.5s';
                box.style.opacity = '0';
                box.style.transform = 'translateY(-10px)';
                setTimeout(() => box.classList.add('hidden'), 500);
            }

            // Check if there is a pending file waiting to upload
            if (pendingUploadFile) {
                // If not yet uploaded, start upload
                if (!currentUploadedUrl) {
                    startUploadProcess(pendingUploadFile);
                } else {
                    // Already uploaded (edge case), just go next
                    setTimeout(() => { if (currentStep === 1) window.nextStep(2); }, 500);
                }
            }

        } else {
            isVerified = false;
            verifyInput.style.borderColor = '#ef4444';
            verifyInput.style.backgroundColor = '#fff';
            // Only show error if they typed something of significant length? 
            // Or just always show error? Let's show only if length > 0
            if (e.target.value.length > 0 && errorMsg) errorMsg.classList.remove('hidden');
        }
    });
}
