'use client';

import { useEffect } from 'react';

import { BUSINESS, CONTACT_EMAIL } from '../lib/business';

import '@n8n/chat/style.css';
import './ShopChat.css';

/**
 * The chat window over the catalogue.
 *
 * It answers what is in the case, and when the answer is no it keeps what the
 * visitor was looking for. That second part is the point: Mike buys to order
 * and takes in estates, so someone who wants a coin he has not listed is worth
 * more than a page view -- today they simply leave.
 *
 * The disclosure is not decoration. On a one-man dealer's site a visitor
 * reasonably reads "ask me" as Mike himself, and someone weighing up whether to
 * hand over a parent's coin collection deserves to know who they are talking to
 * before they decide. It sits in the header subtitle because that is the only
 * slot the widget keeps on screen -- see the note below.
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
        // Streaming is OFF, and it is not a preference.
        //
        // The chat trigger only streams when the agent is the node that answers
        // the request. Here the agent is followed by the extract/shape/save
        // chain that records the enquiry, so n8n answers from the end of the
        // flow and returns ordinary JSON. A client set to expect a stream then
        // renders nothing at all -- the reply arrives and is never shown.
        //
        // Getting streaming back means making the agent the responding node,
        // which means giving up the guarantee that every turn is recorded. The
        // recording is worth more than the perceived latency: it is the whole
        // reason the chat exists.
        showWelcomeScreen: false,
        // First person for what the assistant does, third person for Mike.
        // "We will keep an eye out" was a promise software cannot keep, and the
        // corporate plural blurs who is speaking on a site run by one man.
        //
        // The second line names the estate path explicitly. Mike said those are
        // the two enquiries that matter, and someone settling a parent's estate
        // will not think to ask a coin-shop chatbot unless it is offered.
        initialMessages: [
          `Ask what is in the case and I will search the catalogue.`,
          `Hunting something in particular? Tell me and I will put it on Mike's want list. Settling an estate? Say so and he will get back to you himself.`,
        ],
        i18n: {
          en: {
            title: BUSINESS.name,
            // The disclosure lives in the subtitle because it is the only slot
            // that is genuinely persistent. i18n.footer looks like the obvious
            // home for it and is a trap: the widget only renders that on the
            // welcome screen, which is switched off here, so it never appeared
            // at all. A first message would scroll away, which is no better.
            //
            // Two jobs, and both have to survive: say plainly this is not Mike,
            // and keep a route to an actual person on screen at all times so
            // the chat is never the only road.
            subtitle: `Automated assistant — Mike reads everything it collects. ${CONTACT_EMAIL}`,
            footer: '',
            getStarted: 'New conversation',
            // A concrete example teaches the format and shows the catalogue is
            // searchable to that depth. The estate path is in the greeting, so
            // this can afford to be coin-shaped.
            inputPlaceholder: 'e.g. Morgan dollar, 1890s, VF or better',
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
