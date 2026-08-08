# What's running

A one-page answer to "what does Eric have running in my business", so it can be
answered without Eric in the room.

Everything below lives in n8n, at
[n8n-bwcoins.ger3.ericdahl.dev](https://n8n-bwcoins.ger3.ericdahl.dev). Each one
is its own page there, and each has an **Active** switch in the top right. That
switch is the off switch.

## One of these is on. The other four are buttons.

Only the shop chat runs by itself. The other four do nothing at all until
somebody opens them and presses **Execute workflow**. They cannot surprise you,
spend money on their own, or change a row while you are asleep.

### Shop chat (public demo) - ON

The chat box in the bottom corner of bwcoins.ericdahl.dev. It searches the
inventory and answers questions about what is in the case, and when somebody
asks for a coin that isn't listed it writes down what they wanted. Anything that
sounds like an estate gets handed off rather than answered.

It never sees purchase price, cost basis or the minimum acceptable price. Those
columns are not sent to it at all.

Enquiries land in the **Enquiries** table in Airtable.

**To stop it:** turn Active off. The chat box stays on the website but stops
replying, so this is the emergency brake rather than the tidy way to remove it.
Taking the box off the page entirely is a website change, so that one is Eric.

### Ask about the inventory - off

The same idea, but private and for you: a chat that can see everything,
including cost and margin, for questions like "what have I got in silver under
fifty dollars". Nothing it says goes anywhere near a customer.

**To run it:** open it and use the chat button at the bottom of the page.

### Create eBay offers from inventory - off

Takes coins from the inventory and builds draft eBay listings from them: title,
description, price, photos. Drafts only. Nothing is published, and nothing goes
live without you pressing publish on eBay yourself.

Not finished. It still needs your eBay account connected.

**To run it:** open it and press Execute workflow.

### Listing copy from real sources - off

Writes the description for a coin, using real reference material rather than
inventing history. Produces text to paste, and changes nothing on its own.

**To run it:** open it and press Execute workflow.

### Melt value from live spot prices - off

Looks up today's gold and silver prices and works out what the metal in a coin
is worth, so there is a floor under the asking price.

**To run it:** open it and press Execute workflow.

## If something looks wrong

Every run is recorded. Open the workflow, click **Executions**, and the last run
is at the top with every step it took and what came out. Nothing is hidden, and
nothing is deleted.

If a workflow is doing something you don't want, turn Active off first and ask
second. Turning one off breaks nothing permanently.
