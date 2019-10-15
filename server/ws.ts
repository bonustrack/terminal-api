export const sendMessage = (ws, type, content) => {
  const message = JSON.stringify([type, content]);
  try {
    ws.send(message);
  } catch (e) {
    console.log(e);
  }
};

export const sendResponse = (ws, tag, response) => {
  sendMessage(ws, 'response', { tag, response });
};

export const sendErrorResponse = (ws, tag, error) => {
  const payload = { tag, response: { error } };
  sendMessage(ws, 'response', payload);
};

export const justsaying = (ws, subject, body) => {
  const payload = { subject, body };
  sendMessage(ws, 'justsaying', payload);
};
