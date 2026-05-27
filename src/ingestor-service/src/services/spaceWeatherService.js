import nasaClient from '../integrations/nasaClient.js';

/**
 * Parses GST messages from /DONKI/notifications endpoint.
 * Note: A URL explícita /DONKI/notifications foi exigida pelo professor.
 * Se fosse possível, o endpoint /DONKI/GST retornaria os dados já estruturados e prontos para uso.
 */
export const fetchDonkiEvents = async (startDate, endDate) => {
  try {
    const response = await nasaClient.get('/DONKI/notifications', {
      params: {
        startDate,
        endDate,
        type: 'GST',
      },
    });

    // The endpoint returns an array of messages:
    // { messageType: 'GST', messageID: '...', messageBody: '...' }
    // We need to extract gstID and allKpIndex from messageBody.
    const events = response.data || [];
    const parsedEvents = [];

    for (const event of events) {
      if (!event.messageBody) continue;

      const body = event.messageBody;
      const parsedEvent = {
        messageID: event.messageID,
        messageType: event.messageType,
        messageIssueTime: event.messageIssueTime,
        originalMessageBody: body, // Keep original for reference
      };

      // Extract GST ID (e.g. 2024-11-15T05:00:00-GST-001)
      // Usually looks like: Message ID: 2024-11-15T05:00:00-GST-001
      // However, donki notifications have different formats, but we assume we can extract gstID
      const gstIdMatch = body.match(/Message ID:\s*([^\s]+)/i);
      if (gstIdMatch) {
        parsedEvent.gstID = gstIdMatch[1];
      } else {
         // Fallback se não encontrar o 'Message ID:' no texto, usa o messageID da notificação
         parsedEvent.gstID = event.messageID;
      }

      // Extract Kp indices. E.g. Kp=6, ou Kp index: 6
      // In DONKI notifications, Kp values often appear like "Kp=6", "Kp = 6", "Kp index of 6", "Kp: 6"
      // or "Estimated Kp: 8"
      const kpRegex = /Kp(?: index)?(?:\s*of|\s*:|\s*=)?\s*(\d+(?:\.\d+)?)/gi;
      const allKpIndex = [];
      let match;
      while ((match = kpRegex.exec(body)) !== null) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) {
          allKpIndex.push({ kpIndex: val });
        }
      }

      if (allKpIndex.length > 0) {
        parsedEvent.allKpIndex = allKpIndex;
      }

      // Extract event date to use as reference.
      // Message Issue Time: 2017-09-07T12:08:00Z ou Issue Time: ...
      const issueTimeMatch = body.match(/Issue Time:\s*([^\s]+)/i);
      if (issueTimeMatch) {
        parsedEvent.startTime = issueTimeMatch[1];
      } else {
        parsedEvent.startTime = event.messageIssueTime;
      }

      parsedEvents.push(parsedEvent);
    }

    return parsedEvents;
  } catch (error) {
    console.error('Error fetching DONKI events:', error);
    throw error;
  }
};

export const fetchHazardousAsteroids = async (startDate, endDate) => {
  try {
    const response = await nasaClient.get('/neo/rest/v1/feed', {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching NEO feed:', error);
    throw error;
  }
};
