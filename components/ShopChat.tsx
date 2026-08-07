'use client';

import { useEffect } from 'react';

import '@n8n/chat/style.css';
import './ShopChat.css';

/**
 * The chat window over the catalogue.
 *
 * It answers what is in the case, and when the answer is no -- which it will be
 * most of the time while the collection is small -- it keeps what the visitor
 * was looking for. That second part is the point: Mike buys to order, and today
 * someone who wants a coin he has not listed simply leaves.
 *
 * Loaded on the client only, and dynamically. The widget touches `document` as
 * soon as it is imported, so a top-level import would break the server render;
 * and it is a few hundred kilobytes of JavaScript that nobody who never opens
 * the chat should pay for.
 *
 * The webhook URL is public by nature -- it ends up in the browser either way --
 * so it lives in NEXT_PUBLIC_CHAT_WEBHOOK_URL rather than pretending to be a
 * secret. What protects the data is on the n8n side: the catalogue tool has a
 * field allow-list, so cost basis and the minimum acceptable price are never
 * sent to the model at all.
 */
export default function ShopChat() {
  useEffect(() => {
    const webhookUrl = process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL;

    // No URL configured is a perfectly normal state -- a preview build, or a
    // deploy where the chat is deliberately off. Render nothing rather than
    // mounting a widget that would fail on first message.
    if (!webhookUrl) return;

    let cancelled = false;

    void import('@n8n/chat').then(({ createChat }) => {
      if (cancelled) return;
      createChat({
        webhookUrl,
        mode: 'window',
        // Off, because the session id is per browser session and a returning
        // visitor reloading into a half-finished conversation reads as the shop
        // having remembered something it should not.
        loadPreviousSession: false,
        showWelcomeScreen: false,
        initialMessages: [
          'Ask me what we have in the case.',
          'Looking for something in particular? Tell me and we will keep an eye out for it.',
        ],
        i18n: {
          en: {
            title: 'Brandywine Coins',
            subtitle: 'Ask about the collection.',
            footer: '',
            getStarted: 'New conversation',
            inputPlaceholder: 'What are you looking for?',
            closeButtonTooltip: 'Close',
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
