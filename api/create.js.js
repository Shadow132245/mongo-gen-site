const urllib = require('urllib');

// إعدادات البيئة
const config = {
    public_key: process.env.MONGO_PUBLIC_KEY,
    private_key: process.env.MONGO_PRIVATE_KEY,
    project_id: process.env.MONGO_PROJECT_ID,
    cluster_host: process.env.MONGO_CLUSTER_HOST
};

export default async function handler(req, res) {
    // 1. تفعيل CORS (للسماح للموقع بالاتصال)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // التعامل مع طلب الـ OPTIONS (للمتصفحات)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. التأكد أن الطلب هو POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed. Please use the button on the website." });
    }

    // 3. كود الإنشاء
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
            res.status(200).json({ success: true, link: connectionString });
        } else {
            const respStr = data.toString();
            if (respStr.includes("Duplicate")) {
                res.status(409).json({ error: "لديك حساب بالفعل!" });
            } else {
                res.status(500).json({ error: "خطأ من MongoDB", details: respStr });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
}
