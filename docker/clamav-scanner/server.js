const net = require('net');
const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const CLAMD_HOST = process.env.CLAMD_HOST || '127.0.0.1';
const CLAMD_PORT = parseInt(process.env.CLAMD_PORT || '3310', 10);
const CHUNK_SIZE = 4096;

// Talks the clamd "INSTREAM" protocol directly over TCP: a null-terminated
// command, followed by (4-byte big-endian length + chunk) pairs, ended by a
// zero-length chunk. See https://docs.clamav.net/manual/Usage/Scanning.html
function scanBuffer(buffer) {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection({ host: CLAMD_HOST, port: CLAMD_PORT });
        let response = '';

        socket.setTimeout(60000, () => {
            socket.destroy(new Error('Timeout while scanning file'));
        });

        socket.on('connect', () => {
            socket.write('zINSTREAM\0');

            let offset = 0;
            while (offset < buffer.length) {
                const chunk = buffer.subarray(offset, offset + CHUNK_SIZE);
                const sizeHeader = Buffer.alloc(4);
                sizeHeader.writeUInt32BE(chunk.length, 0);
                socket.write(sizeHeader);
                socket.write(chunk);
                offset += CHUNK_SIZE;
            }
            socket.write(Buffer.alloc(4)); // zero-length chunk = end of stream
        });

        socket.on('data', (data) => {
            response += data.toString('utf8');
        });

        socket.on('end', () => resolve(response));
        socket.on('error', reject);
    });
}

app.get('/health', (req, res) => res.status(200).send('OK'));

app.post('/scan', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file provided (expected multipart field "file")' });
    }

    try {
        const response = await scanBuffer(req.file.buffer);
        const virusMatch = response.match(/stream:\s*(.*)\s+FOUND/);

        if (virusMatch) {
            return res.json({ clean: false, virus: virusMatch[1].trim() });
        }
        if (response.includes('OK')) {
            return res.json({ clean: true });
        }
        return res.status(502).json({ error: `Unexpected clamd response: ${response.trim()}` });
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`clamav-scanner listening on port ${PORT}`);
});
