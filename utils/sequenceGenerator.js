const pool = require('../config/db');

/**
 * Gets the next sequence value for a given entity type in a specific boutique
 * and formats it with the provided prefix (e.g. ORD-001)
 * 
 * @param {number} boutique_id - The ID of the boutique
 * @param {string} entity_type - The type of entity ('order', 'quotation', etc)
 * @param {string} prefix - The prefix to prepend (e.g. 'ORD')
 * @returns {Promise<string>} The formatted sequence string
 */
const generateDisplayId = async (boutique_id, entity_type, prefix) => {
  const seqRes = await pool.query(
    `INSERT INTO boutique_sequences (boutique_id, entity_type, next_value) 
     VALUES ($1, $2, 1) 
     ON CONFLICT (boutique_id, entity_type) 
     DO UPDATE SET next_value = boutique_sequences.next_value + 1 
     RETURNING next_value`,
    [boutique_id, entity_type]
  );
  
  const seqNum = seqRes.rows[0].next_value;
  // Format as 3 digits (e.g. 001)
  const formattedNum = String(seqNum).padStart(3, '0');
  
  return `${prefix}-${formattedNum}`;
};

module.exports = { generateDisplayId };
