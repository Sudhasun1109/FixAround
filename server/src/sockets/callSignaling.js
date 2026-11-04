const { pool } = require('../config/database');

/**
 * Configure WebRTC Signaling & Call Management on Socket.IO
 * @param {import('socket.io').Server} io
 */
function setupCallSignaling(io) {
  io.on('connection', (socket) => {
    // 1. INITIATE CALL
    socket.on('call:initiate', async (data, callback) => {
      try {
        const { bookingId, callerId, callerName, callType = 'voice', sdpOffer } = data;
        if (!bookingId || !callerId) {
          if (callback) callback({ success: false, error: 'Missing bookingId or callerId' });
          return;
        }

        // Verify authorization against database
        const [bookings] = await pool.query(
          'SELECT id, customer_id, technician_id, status FROM bookings WHERE id = ? LIMIT 1',
          [bookingId]
        );

        if (bookings.length === 0) {
          if (callback) callback({ success: false, error: 'Booking not found' });
          return;
        }

        const booking = bookings[0];
        const isCustomer = Number(booking.customer_id) === Number(callerId);
        const isTechnician = Number(booking.technician_id) === Number(callerId);

        if (!isCustomer && !isTechnician) {
          if (callback) callback({ success: false, error: 'Unauthorized to call for this booking' });
          return;
        }

        const receiverId = isCustomer ? booking.technician_id : booking.customer_id;
        if (!receiverId) {
          if (callback) callback({ success: false, error: 'No technician assigned to this booking yet' });
          return;
        }

        // Record call session in database
        const [result] = await pool.query(
          `INSERT INTO call_sessions 
           (booking_id, caller_id, receiver_id, call_type, status, started_at)
           VALUES (?, ?, ?, ?, 'initiated', UTC_TIMESTAMP())`,
          [bookingId, callerId, receiverId, callType]
        );
        const sessionId = result.insertId;

        // Relay call notification to recipient's room and booking room
        const callPayload = {
          sessionId,
          bookingId,
          callerId,
          callerName: callerName || (isCustomer ? 'Customer' : 'Technician'),
          callerRole: isCustomer ? 'customer' : 'technician',
          receiverId,
          callType,
          sdpOffer,
          timestamp: new Date().toISOString()
        };

        io.to(`user_${receiverId}`).emit('call:incoming', callPayload);
        io.to(`booking_${bookingId}`).emit('call:status', { sessionId, status: 'ringing', bookingId });

        if (callback) callback({ success: true, sessionId, receiverId });
      } catch (err) {
        console.error('[CallSignaling Error] call:initiate failed:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 2. ACCEPT CALL
    socket.on('call:accept', async (data, callback) => {
      try {
        const { sessionId, bookingId, sdpAnswer } = data;
        await pool.query(
          `UPDATE call_sessions 
           SET status = 'connected', started_at = UTC_TIMESTAMP()
           WHERE id = ?`,
          [sessionId]
        );

        io.to(`booking_${bookingId}`).emit('call:accepted', {
          sessionId,
          bookingId,
          sdpAnswer
        });

        if (callback) callback({ success: true });
      } catch (err) {
        console.error('[CallSignaling Error] call:accept failed:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 3. REJECT CALL
    socket.on('call:reject', async (data, callback) => {
      try {
        const { sessionId, bookingId, reason = 'declined' } = data;
        await pool.query(
          `UPDATE call_sessions 
           SET status = 'rejected', ended_at = UTC_TIMESTAMP()
           WHERE id = ?`,
          [sessionId]
        );

        io.to(`booking_${bookingId}`).emit('call:rejected', {
          sessionId,
          bookingId,
          reason
        });

        if (callback) callback({ success: true });
      } catch (err) {
        console.error('[CallSignaling Error] call:reject failed:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 4. RELAY ICE CANDIDATES
    socket.on('call:ice_candidate', (data) => {
      const { bookingId, targetUserId, candidate } = data;
      if (targetUserId) {
        io.to(`user_${targetUserId}`).emit('call:ice_candidate', { candidate, bookingId });
      } else if (bookingId) {
        socket.to(`booking_${bookingId}`).emit('call:ice_candidate', { candidate, bookingId });
      }
    });

    // 5. END CALL
    socket.on('call:end', async (data, callback) => {
      try {
        const { sessionId, bookingId } = data;
        if (sessionId) {
          await pool.query(
            `UPDATE call_sessions 
             SET status = 'ended', 
                 ended_at = UTC_TIMESTAMP(),
                 duration_seconds = GREATEST(0, TIMESTAMPDIFF(SECOND, COALESCE(started_at, UTC_TIMESTAMP()), UTC_TIMESTAMP()))
             WHERE id = ?`,
            [sessionId]
          );
        }

        io.to(`booking_${bookingId}`).emit('call:ended', {
          sessionId,
          bookingId
        });

        if (callback) callback({ success: true });
      } catch (err) {
        console.error('[CallSignaling Error] call:end failed:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });
  });
}

module.exports = { setupCallSignaling };
