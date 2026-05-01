import http from 'node:http';

const port = Number(process.env.LOCAL_AI_PROXY_PORT || 8787);
const targetBaseUrl = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234/v1';

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type,authorization',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type,authorization',
    });
    res.end();
    return;
  }

  try {
    const incomingUrl = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    if (!incomingUrl.pathname.startsWith('/v1/')) {
      sendJson(res, 404, { error: 'Only /v1/* routes are proxied to LM Studio.' });
      return;
    }

    const targetUrl = new URL(`${targetBaseUrl.replace(/\/$/, '')}${incomingUrl.pathname.replace('/v1', '')}${incomingUrl.search}`);
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
    const targetResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body,
    });

    const responseText = await targetResponse.text();
    res.writeHead(targetResponse.status, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type,authorization',
      'Content-Type': targetResponse.headers.get('content-type') || 'application/json',
    });
    res.end(responseText);
  } catch (error) {
    sendJson(res, 502, {
      error: `LM Studio proxy failed: ${error.message}`,
    });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`LM Studio proxy listening at http://127.0.0.1:${port}/v1`);
  console.log(`Forwarding requests to ${targetBaseUrl}`);
});
