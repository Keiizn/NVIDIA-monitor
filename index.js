import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import winston from 'winston';

// Load .env file
dotenv.config();

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// NVIDIA API Endpoint
const API_URL = "https://api.nvidia.partners/edge/product/search?locale=fr-fr&page=1&limit=12";

// Headers (to mimic a browser request)
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://marketplace.nvidia.com/",
    "Origin": "https://marketplace.nvidia.com"
};

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const PRODUCT_STATE_FILE = 'product_state.json';

async function loadProductState() {
    try {
        if (fs.existsSync(PRODUCT_STATE_FILE)) {
            const data = fs.readFileSync(PRODUCT_STATE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        logger.error(`Error loading product state: ${error.message}`);
    }
    return {};
}

async function saveProductState(state) {
    try {
        fs.writeFileSync(PRODUCT_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
        logger.info("Product state saved successfully.");
    } catch (error) {
        logger.error(`Error saving product state: ${error.message}`);
    }
}

async function fetchProductData() {
    /** Fetch product data from the API */
    logger.info("Fetching NVIDIA API...");
    try {
        const response = await axios.get(API_URL, { headers: HEADERS, timeout: 10000 });
        logger.info("Product data fetched successfully.");
        return response.data;
    } catch (error) {
        logger.error(`Error fetching product data: ${error.message}`);
        return null;
    }
}

async function sendInitialStatus(products) {
    /** Send initial status of all products to Telegram */
    logger.info("Sending initial status of all products to Telegram...");

    for (const product of products) {
        const name = product.productTitle || "Unknown GPU";
        const sku = product.productSKU || "Unknown SKU";
        const price = product.productPrice || "Unknown Price";
        const status = product.prdStatus || "out_of_stock";
        const link = product.internalLink || "";

        const statusEmoji = status === "buy_now" ? "🟢 AVAILABLE" : "🔴 OUT OF STOCK";

        const message = `Product:\n\n` +
                        `🎮 **Title**: ${name}\n` +
                        `🏷️ **SKU**: ${sku}\n` +
                        `💰 **Price**: ${price}\n` +
                        `📦 **Status**: ${statusEmoji}\n\n` +
                        `🔗 **Link**: ${link}`;

        await sendTelegramNotification(message);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before sending the next message
    }
}

async function checkStock() {
    /** Check the stock status */
    logger.info("Checking stock status for all products...");
    const data = await fetchProductData();
    if (!data) {
        logger.warn("No product data available.");
        return;
    }

    const products = data.searchedProducts?.productDetails || [];
    const previousProductStatus = await loadProductState();
    let messagesToSend = [];
    let changesDetected = false;

    for (const product of products) {
        const name = product.productTitle || "Unknown GPU";
        const sku = product.productSKU || "Unknown SKU";
        const price = product.productPrice || "Unknown Price";
        const status = product.prdStatus || "out_of_stock";
        const link = product.internalLink || "";

        const statusEmoji = status === "buy_now" ? "🟢 AVAILABLE" : "🔴 OUT OF STOCK";

        const message = `Product:\n\n` +
                        `🎮 **Title**: ${name}\n` +
                        `🏷️ **SKU**: ${sku}\n` +
                        `💰 **Price**: ${price}\n` +
                        `📦 **Status**: ${statusEmoji}\n\n` +
                        `🔗 **Link**: ${link}`;

        logger.info(`Product found: ${name}`);

        if (previousProductStatus[sku] !== status) {
            logger.info(`Status change detected for product ${name}. Sending notification.`);
            messagesToSend.push(message);
            previousProductStatus[sku] = status;
            changesDetected = true;
        } else {
            logger.info(`No status change for product ${name}.`);
        }
    }

    if (!changesDetected) {
        logger.info("No change detected.");
    }

    await saveProductState(previousProductStatus);

    for (const message of messagesToSend) {
        await sendTelegramNotification(message);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before sending the next message
    }
}

async function sendTelegramNotification(message) {
    /** Send a notification  Telegram */
    logger.info("Sending Telegram notification...");
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: "Markdown" };

    try {
        const response = await axios.post(url, payload);
        if (response.status === 200) {
            logger.info("Telegram notification sent successfully.");
        } else {
            logger.error(`Telegram error: ${response.data}`);
        }
    } catch (error) {
        logger.error(`Error sending Telegram notification: ${error.message}`);
    }
}

async function main() {
    logger.info("🔍 Starting NVIDIA stock checker...");
    const data = await fetchProductData();
    if (data) {
        const products = data.searchedProducts?.productDetails || [];
        await sendInitialStatus(products); // Send initial stock status
    }
    while (true) {
        await checkStock();
        logger.info("Waiting for 30 seconds before the next check...");
        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
    }
}

main();
