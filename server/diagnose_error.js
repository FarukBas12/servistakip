const API_URL = 'http://localhost:5000/api';

async function testTaskCreation() {
    console.log('🔍 Hata Teşhis Aracı Çalışıyor (Empty Date Test)...');

    try {
        // 1. Login
        console.log('1. Giriş yapılıyor...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'password'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed with status: ${loginRes.status}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;

        // 2. Create Task with EMPTY STRING DATE
        console.log('2. Görev oluşturma deneniyor (due_date: "").');
        const taskData = {
            title: 'Test Görevi Empty Date',
            description: 'Tarih boş string',
            address: 'Test Adresi',
            due_date: '', // <--- CRITICAL TEST
            assigned_to: null,
            region: 'Diğer',
            maps_link: '',
            lat: 0,
            lng: 0
        };

        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(taskData)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('   ❌ API HATASI:');
            console.error('   Status:', res.status);
            console.error('   Body:', errorText);
        } else {
            const data = await res.json();
            console.log('   ✅ Görev BAŞARIYLA oluşturuldu!');
            console.log('   Dönen Veri ID:', data.id);
        }

    } catch (err) {
        console.error('   ❌ BAĞLANTI HATASI:', err.message);
    }
}

testTaskCreation();
