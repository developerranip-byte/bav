import { CountingEntry } from '../models/CountingEntry.js';

export const createCountingEntry = async (req, res) => {
  try {
    const {
      date,
      gentsCount,
      ladiesCount,
      childrenCount,
      balBoysCount,
      balGirlsCount,
      balPathiBoysCount,
      balPathiGirlsCount,
      mobileCount,
      luggageCount,
      threeWheelerCount, twoWheelerCount, fourWheelerCount,
      carInCount, carOutCount,
      centerId
    } = req.body;

    const userId = req.user?.id || null;

    const query = `
      INSERT INTO counting_entries (
        countingDate,
        gentsCount, ladiesCount, childrenCount,
        balSatsangBoysCount, balSatsangGirlsCount,
        balPathiBoysCount, balPathiGirlsCount,
        mobileCount, luggageCount,
        threeWheelerCount, twoWheelerCount, fourWheelerCount,
        carInCount, carOutCount,
        userId, centerId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const fallbackDate = () => {
      const d = new Date();
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    const finalDate = date || fallbackDate();
    const finalCenter = centerId || null;

    if (finalCenter) {
      const existing = await CountingEntry.findExisting(finalDate, finalCenter);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'A counting record for this date and center already exists. Please edit the existing record below instead.' });
      }
    }

    const values = [
      finalDate,
      gentsCount || 0, ladiesCount || 0, childrenCount || 0,
      balBoysCount || 0, balGirlsCount || 0,
      balPathiBoysCount || 0, balPathiGirlsCount || 0,
      mobileCount || 0, luggageCount || 0,
      threeWheelerCount || 0, twoWheelerCount || 0, fourWheelerCount || 0,
      carInCount || 0, carOutCount || 0,
      userId, centerId || null
    ];

    const insertId = await CountingEntry.create(values);

    res.status(201).json({
      message: 'Counting entry saved successfully',
      id: insertId
    });
  } catch (error) {
    console.error('Error creating counting entry:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getCountingEntries = async (req, res) => {
  try {
    const rows = await CountingEntry.getAllWithCenter();
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching counting entries:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateCountingEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      gentsCount,
      ladiesCount,
      childrenCount,
      balBoysCount,
      balGirlsCount,
      balPathiBoysCount,
      balPathiGirlsCount,
      mobileCount,
      luggageCount,
      threeWheelerCount,
      twoWheelerCount,
      fourWheelerCount,
      carInCount,
      carOutCount,
      centerId
    } = req.body;

    const finalCenter = centerId || null;

    if (finalCenter && date) {
      const existing = await CountingEntry.findExisting(date, finalCenter, id);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Another counting record for this date and center already exists.' });
      }
    }

    const affectedRows = await CountingEntry.update(values);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Counting entry not found' });
    }
    res.json({ message: 'Counting entry updated successfully' });
  } catch (error) {
    console.error('Error updating counting entry:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteCountingEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await CountingEntry.delete(id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Counting entry not found' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting counting entry:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
