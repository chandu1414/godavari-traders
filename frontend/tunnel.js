import localtunnel from 'localtunnel';
import http from 'http';

async function start() {
  console.log('Connecting to localtunnel on port 5000...');
  try {
    const tunnel = await localtunnel({ port: 5000 });
    console.log(`\n=================================================`);
    console.log(` PUBLIC MOBILE ACCESS URL:`);
    console.log(` ${tunnel.url}`);
    console.log(`=================================================\n`);

    // Fetch public IP which localtunnel uses as password on first open
    http.get({ host: 'api.ipify.org', port: 80, path: '/' }, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        console.log(`If prompted for "Tunnel Password / Friendly reminder", enter your IP: ${data.trim()}\n`);
      });
    }).on('error', () => {});

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (err) {
    console.error('Tunnel error:', err);
  }
}

start();
