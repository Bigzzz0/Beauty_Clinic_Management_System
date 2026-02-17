const deductStock = async (connection, product_id, qty_used, staff_id, note) => {
    // Get current stock and product info
    const [products] = await connection.query(`
    SELECT p.pack_size, p.is_liquid, i.full_qty, i.opened_qty, p.main_unit, p.sub_unit
    FROM Product p 
    JOIN Inventory i ON p.product_id = i.product_id 
    WHERE p.product_id = ? FOR UPDATE
  `, [product_id]);

    if (products.length === 0) {
        throw new Error(`Product ID ${product_id} not found`);
    }

    const product = products[0];
    let { full_qty, opened_qty, pack_size, is_liquid } = product;
    let remaining_to_deduct = qty_used;

    // Logic for Liquid/Divisible products
    if (is_liquid) {
        // 1. Deduct from Opened Qty first
        if (opened_qty >= remaining_to_deduct) {
            opened_qty -= remaining_to_deduct;
            remaining_to_deduct = 0;
        } else {
            remaining_to_deduct -= opened_qty;
            opened_qty = 0;

            // 2. Deduct from Full Qty (break packs)
            while (remaining_to_deduct > 0) {
                if (full_qty > 0) {
                    full_qty--;
                    // Open a new pack
                    let new_opened_qty = pack_size;

                    if (new_opened_qty >= remaining_to_deduct) {
                        new_opened_qty -= remaining_to_deduct;
                        remaining_to_deduct = 0;
                        opened_qty = new_opened_qty;
                    } else {
                        remaining_to_deduct -= new_opened_qty;
                        // Continue loop
                    }
                } else {
                    throw new Error(`Stock not sufficient for Product ID ${product_id}`);
                }
            }
        }
    } else {
        // Logic for Solid/Non-Divisible products
        // Convert everything to total units available
        let total_units = (full_qty * pack_size) + opened_qty;

        if (total_units >= remaining_to_deduct) {
            // Calculate new full and opened
            total_units -= remaining_to_deduct;
            full_qty = Math.floor(total_units / pack_size);
            opened_qty = total_units % pack_size;
        } else {
            throw new Error(`Stock not sufficient for Product ID ${product_id}`);
        }
    }

    // Update Inventory
    await connection.query(`
    UPDATE Inventory 
    SET full_qty = ?, opened_qty = ? 
    WHERE product_id = ?
  `, [full_qty, opened_qty, product_id]);

    // Log Movement
    await connection.query(`
    INSERT INTO Stock_Movement 
    (product_id, staff_id, action_type, qty_main, qty_sub, note)
    VALUES (?, ?, 'OUT', 0, ?, ?)
  `, [product_id, staff_id, qty_used, note]);

    return { full_qty, opened_qty };
};

module.exports = { deductStock };
