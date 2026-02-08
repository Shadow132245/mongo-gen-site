const express = require('express');
const bodyParser = require('body-parser');
const urllib = require('urllib');
const cors = require('cors');

const app = express();

// إعدادات البيئة (هنجيبها من إعدادات موقع فيرسل)
const config = {
    public_key: process.env.MONGO_PUBLIC_KEY,
    private_key: process.env.MONGO_PRIVATE_KEY,
    project_id: process.env.MONGO_PROJECT_ID,
    cluster_host: process.env.MONGO_CLUSTER_HOST
};

app.use(cors());
app.use(bodyParser.json());

// ملحوظة: شلنا كود الـ static files لأن فيرسل بيعرض مجلد public تلقائي

// 1. API الإنشاء
app.post('/api/create', async (req, res) => {
    const userToken = req.body.token;
    if (!userToken) return res.status(400).json({ error: "Missing token" });

    const dbUser = `web_${userToken}`;
    const dbPass = `pass${Math.floor(Math.random() * 1000000)}`;
    const url = `https://cloud.mongodb.com/api/atlas/v1.0/groups/${config.project_id}/databaseUsers`;

    try {
        const { data, res: response } = await urllib.request(url, {
            method: 'POST',
            digestAuth: `${config.public_key}:${config.private_key}`,
            headers: { 'Content-Type': 'application/json' },
            data: {
                databaseName: "admin",
                roles: [{ roleName: "atlasAdmin", databaseName: "admin" }],
                username: dbUser,
                password: dbPass
            }
        });

        if (response.status === 201 || response.status === 200) {
            const connectionString = `mongodb+srv://${dbUser}:${dbPass}@${config.cluster_host}/?retryWrites=true&w=majority`;
            res.json({ success: true, link: connectionString });
        } else {
            const respStr = data.toString();
            if (respStr.includes("Duplicate")) {
                res.status(409).json({ error: "لديك حساب بالفعل!" });
            } else {
                res.status(500).json({ error: "خطأ من MongoDB" });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

// 2. API الحذف
app.post('/api/delete', async (req, res) => {
    const userToken = req.body.token;
    if (!userToken) return res.status(400).json({ error: "Missing token" });

    const dbUser = `web_${userToken}`;
    const url = `https://cloud.mongodb.com/api/atlas/v1.0/groups/${config.project_id}/databaseUsers/admin/${dbUser}`;

    try {
        const { res: response } = await urllib.request(url, {
            method: 'DELETE',
            digestAuth: `${config.public_key}:${config.private_key}`,
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 204 || response.status === 200) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "لا يوجد حساب للحذف." });
        }
    } catch (error) {
        res.status(500).json({ error: "خطأ في الحذف" });
    }
});

// تصدير التطبيق عشان فيرسل يشغله (بدل app.listen)
module.exports = app;
