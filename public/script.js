// توليد توكن عشوائي للمستخدم وحفظه في المتصفح
let userToken = localStorage.getItem('user_mongo_token');
if (!userToken) {
    userToken = Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_mongo_token', userToken);
}

const createBtn = document.getElementById('createBtn');
const deleteBtn = document.getElementById('deleteBtn');
const statusMsg = document.getElementById('statusMessage');
const resultArea = document.getElementById('resultArea');
const mongoLinkInput = document.getElementById('mongoLink');
const copyBtn = document.getElementById('copyBtn');

// دالة لإظهار الرسائل
function showStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = `status ${type}`;
    statusMsg.classList.remove('hidden');
}

// 1. إنشاء الرابط
createBtn.addEventListener('click', async () => {
    showStatus('جاري الاتصال بسيرفرات MongoDB... ⏳', 'loading');
    createBtn.disabled = true;
    resultArea.classList.add('hidden');

    try {
        const response = await fetch('/api/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: userToken })
        });
        const data = await response.json();

        if (response.ok) {
            showStatus('✅ تم إنشاء قاعدة البيانات بنجاح!', 'success');
            mongoLinkInput.value = data.link;
            resultArea.classList.remove('hidden');
        } else {
            showStatus(`❌ خطأ: ${data.error}`, 'error');
        }
    } catch (err) {
        showStatus('❌ خطأ في الاتصال بالسيرفر.', 'error');
    }
    createBtn.disabled = false;
});

// 2. حذف الرابط
deleteBtn.addEventListener('click', async () => {
    if(!confirm("هل أنت متأكد؟ سيتم حذف قاعدة بياناتك والبيانات بداخلها.")) return;

    showStatus('جاري الحذف... 🗑️', 'loading');
    deleteBtn.disabled = true;
    resultArea.classList.add('hidden');

    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: userToken })
        });

        if (response.ok) {
            showStatus('✅ تم حذف قاعدة البيانات بنجاح.', 'success');
            mongoLinkInput.value = '';
        } else {
            showStatus('⚠️ لم يتم العثور على قاعدة بيانات لحذفها.', 'error');
        }
    } catch (err) {
        showStatus('❌ خطأ في الاتصال.', 'error');
    }
    deleteBtn.disabled = false;
});

// زر النسخ
copyBtn.addEventListener('click', () => {
    mongoLinkInput.select();
    document.execCommand('copy');
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>', 2000);
});