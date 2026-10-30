// Loaded only by explicit test --import. No real provider request is allowed.
const originalFetch=globalThis.fetch;
const destination=process.env.SOCIALDESK_TEST_GATEWAY_URL;
if(!destination||new URL(destination).hostname!=='127.0.0.1')throw Error('A local fake gateway is required.');
globalThis.fetch=(input,options)=>{const url=new URL(String(input));if(['graph.instagram.com','graph.facebook.com'].includes(url.hostname))return originalFetch(destination+'/graph'+url.pathname+url.search,options);if(url.origin===new URL(destination).origin)return originalFetch(input,options);throw Error('Real provider network is disabled in this test process.')};
