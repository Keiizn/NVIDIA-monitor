# NVIDIA Monitor / GPU restock monitor

This project is a Telegram bot that checks NVIDIA GPU stock and sends notifications when changes are detected. It uses NVIDIA API to retrieve product information and sends messages via Telegram Bot API.

## Features

- **Initial check**: When the bot starts, it sends a message on Telegram with the current status of all products.
- **Change detection**: The bot periodically checks the stock of products and sends notifications only when it detects a change in the status of a product.
- **Product state storage**: The product state is stored in a `product_state.json` file to allow change detection.
- **Detailed logs**: The bot records detailed logs in the console and in files for each step of the process.

## Prerequisites

- Node.js (version 14 or higher)
- A Telegram account and a configured Telegram bot
- A `.env` file containing the necessary environment variables

```
## Installation

1. Clone this repository:

git clone https://github.com/your-user/nvidia-gpu-stock-checker.git
cd nvidia-gpu-stock-checker


Create a .env file (if it doesn't exist) in the root directory of the project and add your environment variables:

TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

```
## Install dependencies:


```bash
  npm install
```

## Start

```bash
  node index.js
```


The bot will send an initial message on Telegram with the current status of all products.
The bot will then periodically check the stock of the products and send notifications only when it detects a change in the status of a product.

# Configuration

**NVIDIA API:** The NVIDIA API URL is defined in the index.js file. You can change it if needed, to monitor only 5080 or 5090 GPUs use this link: [https://api.nvidia.partners/edge/product/search?locale=en-us&page=1&limit=12&gpu=RTX%205080,RTX%205090&manufacturer=NVIDIA&manufacturer_filter=NVIDIA~2&category=GPU](https://api.nvidia.partners/edge/product/search?locale=fr-fr&page=1&limit=12&gpu=RTX%205080,RTX%205090&manufacturer=NVIDIA&manufacturer_filter=NVIDIA~2&category=GPU)

**Message delay:** The bot waits 2 seconds between sending each message on Telegram. You can adjust this delay in the index.js file.

**Logs**: The bot records detailed logs in the console and in files (error.log and combined.log) for each step of the process. The logs include information about data retrieval, stock checking, and sending notifications.

**License:** This project is licensed under the MIT License. See the LICENSE file for more details.

**Contact:** For any questions or suggestions, you can contact me by email at dboillotpro@gmail.com.


## Authors

- [@keiizn](https://www.github.com/keiizn)




## License

[MIT](https://choosealicense.com/licenses/mit/)

