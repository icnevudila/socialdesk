// Compatibility entrypoint: one persistent server owns all workers and records.
// Load the same .env used by the main application via Node --env-file-if-exists.
process.env.PORT ||= process.env.STATUS_PORT || '4318';
process.env.HOST ||= '127.0.0.1';
await import('../server.mjs');
