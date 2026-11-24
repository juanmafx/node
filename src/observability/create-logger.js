export function createLogger(write = (line) => process.stdout.write(line)) {
  const emit = (level, event, fields) => {
    write(`${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields })}\n`);
  };
  return {
    info: (event, fields = {}) => emit('info', event, fields),
    error: (event, fields = {}) => emit('error', event, fields),
  };
}
