const fs = require('fs');

const OUTPUT_FILE = 'phase9_test_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(OUTPUT_FILE, message + '\n');
}

// Mock Sorting Logic Test
function testSorting() {
    log('Starting Phase 9 Test (Sorting Logic)...');

    const items = [
        { name: 'Product C', qty: 10 },
        { name: 'Product A', qty: 50 },
        { name: 'Product B', qty: 20 }
    ];

    log('Original: ' + JSON.stringify(items));

    // Sort Ascending by Name
    items.sort((a, b) => a.name.localeCompare(b.name));
    log('Sorted Name Asc: ' + JSON.stringify(items));
    if (items[0].name === 'Product A') log('✅ Name Asc Correct');

    // Sort Descending by Qty
    items.sort((a, b) => b.qty - a.qty);
    log('Sorted Qty Desc: ' + JSON.stringify(items));
    if (items[0].qty === 50) log('✅ Qty Desc Correct');
}

// Mock Unit Conversion Test
function testUnitConversion() {
    log('\nStarting Phase 9 Test (Unit Conversion)...');
    const pack_size = 50; // 50 Units per Box
    const qty = 5; // 5 Boxes
    const expected = 250;

    const result = qty * pack_size;
    log(`Qty: ${qty}, Pack Size: ${pack_size}, Result: ${result}`);

    if (result === expected) {
        log('✅ Unit Conversion Correct');
    } else {
        log('❌ Unit Conversion Failed');
    }
}

fs.writeFileSync(OUTPUT_FILE, '');
testSorting();
testUnitConversion();
