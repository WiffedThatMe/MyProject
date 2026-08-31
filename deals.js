export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(503).json({
    live: false,
    message: 'Live retailer deal sources are not connected yet.'
  });
}
