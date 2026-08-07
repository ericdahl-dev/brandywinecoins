'use client';

import { useEffect } from 'react';

import { BUSINESS, CONTACT_EMAIL } from '../lib/business';

import '@n8n/chat/style.css';
import './ShopChat.css';

/**
 * The chat window over the catalogue.
 *
 * It answers what is in the case, and when the answer is no it keeps what the
 * visitor was looking for. That second part is the point: the shop buys to
 * order and takes in estates, so someone who wants a coin that is not listed is
 * worth more than a page view -- today they simply leave.
 *
 * The disclosure is not decoration. A visitor reasonably reads "ask me" as a
 * person, and someone weighing up whether to hand over a parent's coin
 * collection deserves to know who they are talking to before they decide. It
 * sits in the header subtitle because that is the only slot the widget keeps on
 * screen -- see the note below.
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
        // Off, and worth knowing what that actually does: with this false the
        // widget mints a NEW session id on every page load and overwrites the
        // one in localStorage, rather than reusing it. So every visit is its own
        // session, its own Airtable row and its own n8n message buffer, and the
        // three cannot drift apart.
        //
        // The cost is that a reload mid-conversation starts over. Making a
        // session survive a reload but expire after a day would need the
        // widget's session handling overridden, not just configured, and it is
        // not worth that today.
        //
        // If the site ever grows accounts, this stops being a workaround: a
        // conversation would key off the person rather than the browser, and
        // continuity across visits becomes something chosen rather than an
        // accident of localStorage. That is the point to revisit it.
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
        // First person for what the assistant does, "our" for the shop.
        //
        // The owner asked for this after testing it: he would rather the site
        // read as a business than as one man. It reverses the earlier advice to
        // name him, and it is his call -- it is his brand. What does not change
        // is that "keep an eye out" stayed out: it was a promise software cannot
        // keep, where adding something to a want list is one it can.
        //
        // The second line names the estate path explicitly, because those are
        // one of the two enquiries that matter and someone settling a parent's
        // estate will not think to ask a coin-shop chatbot unless it is
        // offered.
        initialMessages: [
          `Ask what is in the case and I will search the catalogue.`,
          `Hunting something in particular? Tell me and I will add it to our want list. Settling an estate? Say so and someone will get back to you directly.`,
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
            // Two jobs, and both have to survive: say plainly that this is not
            // a person, and keep a route to a real one on screen at all times
            // so the chat is never the only road.
            subtitle: `Automated assistant — we read everything it collects. ${CONTACT_EMAIL}`,
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
