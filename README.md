# User Tracking Server

Forensic tracking server for authorized digital investigations.

## Setup Instructions

1. Make sure Node.js is installed on your system.
2. Clone or download this repository.
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. The server will be available at `http://localhost:3000` by default.

## Usage

- The tracking page is available at both `/` and `/track` routes.
- Collected data will be logged to the server console.
- Data is also saved to `tracking_logs.json` file.

## Collected Information

- IP address and geolocation data
- Browser details and user agent
- Operating system and platform
- Screen resolution
- Local network information (via WebRTC when available)
- Device timezone
- Camera/microphone permission status
- GPS location (if permission granted)

## Deployment

For production use:
1. Deploy to your server provider of choice.
2. Consider using a reverse proxy like Nginx for HTTPS.
3. Use PM2 or similar for process management:
   ```
   npm install -g pm2
   pm2 start index.js
   ```

## Legal Notice

This software is intended for authorized use only by law enforcement agencies for conducting digital investigations with proper legal authorization. # fgjhjghj
