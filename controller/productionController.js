const pool = require('../config/db');
const { generateDisplayId } = require('../utils/sequenceGenerator');

const getProduction = async (req, res) => {
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('SELECT * FROM production WHERE boutique_id = $1 ORDER BY created_at DESC', [boutique_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching production:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addProduction = async (req, res) => {
  const { order_id, customer_name, garment, tailor, stage, priority, start_date, expected_end_date, notes } = req.body;
  const boutique_id = req.user.boutique_id;

  if (!customer_name || !garment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const display_id = await generateDisplayId(boutique_id, 'production', 'PRD');

    const result = await pool.query(
      `INSERT INTO production (boutique_id, order_id, customer_name, garment, tailor, stage, priority, start_date, expected_end_date, notes, display_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [boutique_id, order_id || '', customer_name, garment, tailor || '', stage || 'Cutting', priority || 'Medium', start_date || new Date(), expected_end_date, notes || '', display_id]
    );
    res.status(201).json({ message: 'Production item added', production: result.rows[0] });
  } catch (error) {
    console.error('Error adding production:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProductionStage = async (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;
  const boutique_id = req.user.boutique_id;
  if (!stage) return res.status(400).json({ error: 'Stage is required' });

  try {
    const result = await pool.query('UPDATE production SET stage = $1 WHERE id = $2 AND boutique_id = $3 RETURNING *', [stage, id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Production item not found' });

    const item = result.rows[0];

    // Map production stages to order statuses
    const stageToOrderStatusMap = {
      'Cutting': 'Cutting',
      'Stitching': 'Stitching',
      'Trial': 'Trial Scheduled',
      'Ready': 'Completed'
    };

    if (item.order_id) {
      // Handle both old formats (ORD-22) and new direct numeric IDs (22)
      // Since order_id might be display_id (ORD-001) in the future, we need to query by it.
      // But for now, frontend will send the numeric ID. If it has ORD- prefix, strip it (legacy fallback).
      let queryColumn = 'id';
      let queryValue = item.order_id;
      
      if (item.order_id.startsWith('ORD-')) {
        const potentialNum = parseInt(item.order_id.replace('ORD-', ''), 10);
        if (!isNaN(potentialNum)) {
           queryValue = potentialNum;
        } else {
           // It's a display_id like ORD-001
           queryColumn = 'display_id';
        }
      } else if (!isNaN(parseInt(item.order_id, 10))) {
        queryValue = parseInt(item.order_id, 10);
      }

      const mappedStatus = stageToOrderStatusMap[stage];
      if (mappedStatus) {
        await pool.query(
          `UPDATE orders SET status = $1 WHERE ${queryColumn} = $2 AND boutique_id = $3`,
          [mappedStatus, queryValue, boutique_id]
        );
      }
    }



    res.status(200).json({ message: 'Production stage updated', production: item });
  } catch (error) {
    console.error('Error updating production stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProduction = async (req, res) => {
  const { id } = req.params;
  const boutique_id = req.user.boutique_id;
  try {
    const result = await pool.query('DELETE FROM production WHERE id = $1 AND boutique_id = $2 RETURNING *', [id, boutique_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Production item not found' });
    res.status(200).json({ message: 'Production item deleted', production: result.rows[0] });
  } catch (error) {
    console.error('Error deleting production:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getProduction, addProduction, updateProductionStage, deleteProduction };
