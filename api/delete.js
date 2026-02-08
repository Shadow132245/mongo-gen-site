const urllib = require('urllib');

const config = {
    public_key: process.env.MONGO_PUBLIC_KEY,
    private_key: process.env.MONGO_PRIVATE_KEY,
    project_id: process.env.MONGO_PROJECT_ID
};

export default async function handler(req, res) {
    // تفعيل CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

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
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ error: "لا يوجد حساب للحذف." });
        }
    } catch (error) {
        res.status(500).json({ error: "خطأ في الحذف" });
    }
}
