require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

const BASE_URL = process.env.BASE_URL || 'http://85.239.155.13:10222/api';
const API_KEY = process.env.API_KEY || 'gPh7mLluNE0yzIK7ZxSMlIzurKQyefM0O1dtZt5PfP8oW8zfyTD2rtXDd6pwZWfqdxVwilessHsJqSzZQlyxupcTDtnKFrM8ai4g7s9O6bO6c9Ug8eL4qodh6aeyC3vj';
const KOFI_VERIFICATION_TOKEN = 'e1dd4c87-7920-493c-9e60-e3eb419e98e1';
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1452369510551261224/JfyS4MhPy-P_DxgtPc6ZGeP7wGhkJ_sic0LjpVmG_atCyggpUgkmiwB6XP6HVm9zj8bd';

const DONATOR_GROUP_ID = '659efa9f9611b021c3ae066f';
const DONATOR_LIST_ID = '659aabffaf30441de7d24114';

let DONATOR_GROUP_TAG = 'Donators';
let DONATOR_AVAILABLE_GROUP_ID = null;

async function verifyIds() {
  try {
    const listsUrl = `${BASE_URL}/lists/read/getAll?apiKey=${encodeURIComponent(API_KEY)}`;
    const listsResponse = await fetch(listsUrl);
    
    if (listsResponse.ok) {
      const listsData = await listsResponse.json();
      console.log('Available Lists:');
      if (Array.isArray(listsData)) {
        listsData.forEach(list => {
          console.log(`  - ${list.title} (ID: ${list._id})`);
        });
        
        const listExists = listsData.some(list => list._id === DONATOR_LIST_ID);
        if (!listExists) {
          console.warn(`WARNING: List ID ${DONATOR_LIST_ID} not found in available lists!`);
          console.log('Available List IDs:', listsData.map(l => l._id).join(', '));
        } else {
          const foundList = listsData.find(l => l._id === DONATOR_LIST_ID);
          console.log(`List ID verified: ${foundList.title} (${DONATOR_LIST_ID})`);
        }
      }
    } else {
      console.warn('Could not fetch lists:', listsResponse.status);
    }
    
    const clansUrl = `${BASE_URL}/whitelist/read/getAllClans?apiKey=${encodeURIComponent(API_KEY)}`;
    const clansResponse = await fetch(clansUrl);
    
    if (clansResponse.ok) {
      const clansData = await clansResponse.json();
      console.log('Available Clans/Groups:');
      if (Array.isArray(clansData)) {
        clansData.forEach(clan => {
          console.log(`  - ${clan.full_name || clan.tag || 'Unknown'} (ID: ${clan._id})`);
        });
        
        const clanExists = clansData.some(clan => clan._id === DONATOR_GROUP_ID);
        if (!clanExists) {
          console.warn(`WARNING: Group ID ${DONATOR_GROUP_ID} not found in available clans!`);
          console.log('Available Group IDs:', clansData.map(c => c._id).join(', '));
        } else {
          const foundClan = clansData.find(c => c._id === DONATOR_GROUP_ID);
          DONATOR_GROUP_TAG = foundClan.tag || foundClan.full_name || 'Donators';
          if (foundClan.available_groups && foundClan.available_groups.length > 0) {
            DONATOR_AVAILABLE_GROUP_ID = foundClan.available_groups[0];
          }
          console.log(`Group ID verified: ${foundClan.full_name || foundClan.tag} (${DONATOR_GROUP_ID})`);
          console.log(`Using available_group ID: "${DONATOR_AVAILABLE_GROUP_ID}"`);
        }
      }
    } else {
      console.warn('Could not fetch clans:', clansResponse.status);
    }
    
    console.log('');
  } catch (error) {
    console.warn('Could not verify IDs:', error.message);
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function extractSteamID64(message) {
  if (!message) return null;
  
  const steamIdRegex = /\b\d{17}\b/g;
  const matches = message.match(steamIdRegex);
  
  if (matches && matches.length > 0) {
    return matches[0];
  }
  
  return null;
}

function calculateDurationHours(amount, currency) {
  let amountGBP = parseFloat(amount);
  
  if (amountGBP >= 33.00) {
    return 999999;
  } else if (amountGBP >= 26.00) {
    return 6575;
  } else if (amountGBP >= 19.00) {
    return 2190;
  } else if (amountGBP >= 7.50) {
    return 730;
  }
  
  return 0;
}

function getTagName(amount) {
  const amountGBP = parseFloat(amount);
  
  if (amountGBP >= 33.00) {
    return '@ULTIMATE Anglian Donator';
  } else if (amountGBP >= 26.00) {
    return '@Royal Anglian Lifetime Donor';
  } else if (amountGBP >= 19.00) {
    return '@Royal Anglian Sponsor';
  } else if (amountGBP >= 7.50) {
    return '@Squaddie Donator';
  }
  
  return null;
}

function getTierDescription(amount) {
  const amountGBP = parseFloat(amount);
  
  if (amountGBP >= 33.00) {
    return 'Permanent queue jump whitelisting to our Official Servers. Never wait in a Squad queue again. Also receive the @ULTIMATE Anglian Donator holographic discord tag.';
  } else if (amountGBP >= 26.00) {
    return 'Temporary queue jump whitelisting to our Official Squad Servers for 9 months. Receive the @Royal Anglian Lifetime Donor tag.';
  } else if (amountGBP >= 19.00) {
    return 'Temporary queue jump whitelisting to our Official Squad Servers for 3 months. Receive the @Royal Anglian Sponsor tag.';
  } else if (amountGBP >= 7.50) {
    return 'Temporary queue jump whitelisting to our Official Squad Servers for 1 month. Receive the @Squaddie Donator tag.';
  }
  
  return null;
}

async function sendDiscordNotification(kofiData, steamId64, tagName, tierDescription) {
  try {
    const amountGBP = parseFloat(kofiData.amount);
    const isPermanent = amountGBP >= 33.00;
    const duration = isPermanent ? 'Permanent' : 
                     amountGBP >= 26.00 ? '9 months' :
                     amountGBP >= 19.00 ? '3 months' : '1 month';
    
    const embed = {
      title: 'New Ko-fi Donation',
      color: amountGBP >= 33.00 ? 0xFFD700 : 
             amountGBP >= 26.00 ? 0x9B59B6 :
             amountGBP >= 19.00 ? 0x3498DB : 0x2ECC71,
      fields: [
        {
          name: 'Donator',
          value: kofiData.from_name || 'Anonymous',
          inline: true
        },
        {
          name: 'Amount',
          value: `${kofiData.amount} ${kofiData.currency}`,
          inline: true
        },
        {
          name: 'SteamID64',
          value: steamId64,
          inline: false
        },
        {
          name: 'Whitelist Duration',
          value: duration,
          inline: true
        },
        {
          name: 'Discord Tag',
          value: tagName || 'N/A',
          inline: true
        },
        {
          name: 'Tier Benefits',
          value: tierDescription || 'N/A',
          inline: false
        }
      ],
      footer: {
        text: 'Sale prices valid until January 2nd, 2026'
      },
      timestamp: new Date().toISOString()
    };
    
    if (kofiData.message && kofiData.message.trim()) {
      embed.fields.push({
        name: 'Message',
        value: kofiData.message.substring(0, 1024),
        inline: false
      });
    }
    
    const payload = {
      embeds: [embed]
    };
    
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error('Failed to send Discord notification:', response.status, await response.text());
    } else {
      console.log('Discord notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error.message);
  }
}

async function addPlayerToWhitelist(steamId64, discordUsername, username, durationHours) {
  try {
    if (!DONATOR_AVAILABLE_GROUP_ID) {
      throw new Error('Available group ID not found. Make sure the server has verified IDs on startup.');
    }
    
    const url = `${BASE_URL}/whitelist/write/addPlayer?apiKey=${encodeURIComponent(API_KEY)}`;
    
    const payload = {
      apiKey: API_KEY,
      discordUsername: discordUsername || '',
      sel_clan_id: DONATOR_GROUP_ID,
      username: username || 'Donator',
      steamid64: steamId64,
      group: DONATOR_AVAILABLE_GROUP_ID,
      durationHours: durationHours.toString(),
      sel_list_id: DONATOR_LIST_ID
    };
    
    console.log('Adding player to whitelist:', {
      ...payload,
      apiKey: '[REDACTED]'
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`API Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('API Response Raw:', responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('API Response Parsed:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError.message);
      console.log('Response was:', responseText);
      throw new Error(`API returned non-JSON response: ${responseText}`);
    }
    
    if (data.status === 'inserted_new_player' || data.status === 'inserted' || data.status === 'success' || data.inserted === true) {
      console.log('Successfully added player to whitelist!');
      if (data.player) {
        console.log(`Player ID: ${data.player._id || data.insertedId}`);
        console.log(`Username: ${data.player.username}`);
        console.log(`Expiration: ${data.player.expiration || 'Permanent'}`);
      }
      return data;
    }
    
    if (data.status === 'not_inserted' || data.reason) {
      const errorMsg = `FAILED TO INSERT PLAYER: ${data.reason || 'Unknown reason'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.warn('Unknown API response format:', JSON.stringify(data));
    return data;
    
  } catch (error) {
    console.error('Error adding player to whitelist:', error.message);
    throw error;
  }
}

app.post('/webhook/kofi', async (req, res) => {
  try {
    const dataString = req.body.data;
    
    if (!dataString) {
      console.error('No data field in webhook request');
      return res.status(400).send('Missing data field');
    }
    
    const kofiData = JSON.parse(dataString);
    
    if (kofiData.verification_token !== KOFI_VERIFICATION_TOKEN) {
      console.error('Invalid verification token');
      return res.status(401).send('Unauthorized');
    }
    
    console.log('Received Ko-fi webhook:', {
      type: kofiData.type,
      amount: kofiData.amount,
      currency: kofiData.currency,
      from_name: kofiData.from_name,
      message_id: kofiData.message_id
    });
    
    if (kofiData.type !== 'Donation') {
      console.log(`Skipping webhook type: ${kofiData.type}`);
      return res.status(200).send('OK - Not a donation');
    }
    
    if (kofiData.is_public === false) {
      console.log('Donation is private');
    }
    
    const steamId64 = extractSteamID64(kofiData.message);
    
    if (!steamId64) {
      console.error('No SteamID64 found in message:', kofiData.message);
      return res.status(400).send('SteamID64 not found in message');
    }
    
    console.log(`Extracted SteamID64: ${steamId64}`);
    
    const durationHours = calculateDurationHours(kofiData.amount, kofiData.currency);
    
    if (durationHours === 0) {
      console.error(`Amount ${kofiData.amount} ${kofiData.currency} is below minimum threshold`);
      return res.status(400).send('Donation amount below minimum threshold');
    }
    
    const tagName = getTagName(kofiData.amount);
    const tierDescription = getTierDescription(kofiData.amount);
    console.log(`Donation amount: ${kofiData.amount} ${kofiData.currency}, Duration: ${durationHours} hours, Tag: ${tagName}`);
    
    const username = kofiData.from_name || 'Donator';
    const discordUsername = kofiData.discord_username || '';
    
    await addPlayerToWhitelist(
      steamId64,
      discordUsername,
      username,
      durationHours
    );
    
    console.log(`Successfully whitelisted ${username} (SteamID64: ${steamId64}) for ${durationHours} hours`);
    
    await sendDiscordNotification(kofiData, steamId64, tagName, tierDescription);
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('ERROR PROCESSING WEBHOOK:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('---');
    res.status(200).send('OK - Error logged');
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`Invalid PORT: ${process.env.PORT}. Using default port 3000.`);
  process.exit(1);
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Ko-fi webhook server listening on port ${PORT}`);
  console.log(`Webhook endpoint: http://0.0.0.0:${PORT}/webhook/kofi`);
  console.log('Verifying IDs...');
  await verifyIds();
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    console.error(`To find the process: lsof -i :${PORT} or netstat -tulpn | grep ${PORT}`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
