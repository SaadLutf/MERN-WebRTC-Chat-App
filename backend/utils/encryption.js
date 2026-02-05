// backend/utils/encryption.js
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const key = Buffer.from(process.env.MESSAGE_KEY, 'hex');

export const encryptMessage = (msg) => {
    if (!msg) return "";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(msg, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export const decryptMessage = (msg) => {
    // 1. Basic check: if no message or no colon, it's likely plain text
    if (!msg || !msg.includes(':')) {
        return msg;
    }

    try {
        let separate = msg.split(':');
        let ivString = separate[0];
        let encryptedString = separate[1];

        // 2. Safety check: ensure the IV part is the correct length for Hex
        if (ivString.length !== 32) { 
            return msg; // Return as plain text if IV looks wrong
        }

        const iv = Buffer.from(ivString, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decryptedMsg = decipher.update(encryptedString, 'hex', "utf8");
        decryptedMsg += decipher.final("utf-8");

        return decryptedMsg;
    } catch (error) {
        // 3. Emergency Fallback: If anything goes wrong, don't crash the server.
        // Just return the raw message.
        console.error("Decryption error, returning raw message:", error.message);
        return msg;
    }
}