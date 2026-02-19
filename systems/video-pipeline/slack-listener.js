/**
 * Slack listener - watches for "@assistant potential video idea" mentions.
 * Uses Slack Socket Mode for real-time events + Web API for thread reading.
 */
const { WebClient } = require('@slack/web-api');
const { SocketModeClient } = require('@slack/socket-mode');
const config = require('./config.json');
const { runPipeline } = require('./pipeline');

const slackBot = new WebClient(process.env.SLACK_BOT_TOKEN || config.slack.botToken);
const socketClient = new SocketModeClient({
  appToken: process.env.SLACK_APP_TOKEN || config.slack.appToken,
});

/** Fetch full thread context from Slack */
async function getThreadContext(channel, threadTs) {
  const result = await slackBot.conversations.replies({
    channel,
    ts: threadTs,
    inclusive: true,
    limit: 100,
  });
  return result.messages || [];
}

/** Post a message back to a Slack thread */
async function postThreadReply(channel, threadTs, text) {
  return slackBot.chat.postMessage({
    channel,
    thread_ts: threadTs,
    text,
  });
}

/** Handle app_mention events */
async function handleMention(event) {
  const text = (event.text || '').toLowerCase();
  if (!text.includes(config.pipeline.triggerPhrase)) return;

  const channel = event.channel;
  const threadTs = event.thread_ts || event.ts;
  const user = event.user;

  // Acknowledge
  await postThreadReply(channel, threadTs, '🎬 Got it! Researching this video idea now...');

  try {
    // Get full thread for context
    const threadMessages = await getThreadContext(channel, threadTs);
    const threadText = threadMessages.map(m => m.text).join('\n');

    // Extract the idea (everything after trigger phrase)
    const ideaMatch = (event.text || '').match(/potential video idea[:\s]*(.*)/i);
    const idea = ideaMatch ? ideaMatch[1].trim() : threadText;

    const result = await runPipeline({
      idea: idea || threadText,
      threadContext: threadMessages,
      slackChannel: channel,
      slackThreadTs: threadTs,
      slackUser: user,
    });

    if (result.duplicate) {
      await postThreadReply(channel, threadTs,
        `⚠️ This idea is ${(result.similarity * 100).toFixed(0)}% similar to an existing pitch: "${result.duplicateOf}"\nSkipping to avoid duplicates.`);
    } else {
      await postThreadReply(channel, threadTs,
        `✅ Video idea added to pipeline!\n📋 *Asana card:* ${result.asanaUrl}\n🔍 *Research findings:* ${result.researchSummary}\n💡 *Suggested angles:* ${result.angles.join(', ')}`);
    }
  } catch (err) {
    console.error('Pipeline error:', err);
    await postThreadReply(channel, threadTs, `❌ Error processing idea: ${err.message}`);
  }
}

// Socket Mode event listener
socketClient.on('app_mention', async ({ event, ack }) => {
  await ack();
  await handleMention(event);
});

// Also listen via events API wrapper
socketClient.on('message', async ({ event, ack }) => {
  if (ack) await ack();
  if (event.subtype) return;
  const text = (event.text || '').toLowerCase();
  if (text.includes(config.pipeline.triggerPhrase)) {
    await handleMention(event);
  }
});

async function start() {
  await socketClient.start();
  console.log('⚡ Video Pipeline Slack listener running');
}

module.exports = { start, getThreadContext, postThreadReply, handleMention };

if (require.main === module) {
  start().catch(console.error);
}
