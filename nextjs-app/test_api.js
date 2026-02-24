async function run() {
    try {
        const res = await fetch('http://localhost:3000/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_id: 1,
                appointment_date: new Date().toISOString(),
                duration_minutes: 60,
                doctor_id: null,
                therapist_id: null,
                notes: null
            })
        });
        const text = await res.text();
        require('fs').writeFileSync('fetch_out.txt', "Status: " + res.status + "\nBody: " + text);
    } catch (e) {
        require('fs').writeFileSync('fetch_out.txt', "Fetch Error: " + e.message);
    }
}
run();
