async function main() {
    try {
        const res = await fetch('http://localhost:3000/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: "Test",
                last_name: "User",
                phone_number: "0812345678"
            })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch (e) {
        console.error(e);
    }
}
main();
